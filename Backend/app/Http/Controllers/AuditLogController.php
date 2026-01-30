<?php

namespace App\Http\Controllers;

use App\Exports\AuditLogsExport;
use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->input('per_page', 10);
        $perPage = max(5, min($perPage, 100)); // ✅ anti-abus

        $filters = $request->only(['user', 'action', 'subject_type', 'search', 'start_date', 'end_date']);

        $query = $this->buildQuery($request, $filters);

        $auth = $request->user() ?? Auth::user();
        [$isSuperAdmin, $modelTypes] = $this->resolveSuperAdmin($auth);

        return Inertia::render('audit-logs/Index', [
            'logs' => $query->paginate($perPage)->through(function ($log) use ($isSuperAdmin, $modelTypes) {
                $props = $log->properties;
                if (!$props instanceof Collection) {
                    $props = collect(is_array($props) ? $props : []);
                }

                $encrypted = $props->get('sensitive_encrypted');
                $decryptOk = null;

                if ($isSuperAdmin && !empty($encrypted)) {
                    try {
                        $decoded = json_decode(Crypt::decryptString($encrypted), true);
                        $decryptOk = is_array($decoded);

                        if (is_array($decoded)) {
                            $before = $props->get('before', []);
                            $after  = $props->get('after', []);

                            if (!is_array($before)) $before = [];
                            if (!is_array($after))  $after = [];

                            if (!empty($decoded['before']) && is_array($decoded['before'])) {
                                $before = array_merge($before, $decoded['before']);
                            }
                            if (!empty($decoded['after']) && is_array($decoded['after'])) {
                                $after = array_merge($after, $decoded['after']);
                            }

                            $props->put('before', $before);
                            $props->put('after', $after);
                        }
                    } catch (\Throwable $e) {
                        $decryptOk = false;
                    }
                }

                // ✅ on retire le blob
                $props->forget('sensitive_encrypted');

                return [
                    'id' => $log->id,
                    'log_name' => $log->log_name,
                    'event' => $log->event,
                    'description' => $log->description,
                    'subject_type' => $log->subject_type,
                    'subject_id' => (string) $log->subject_id,
                    'causer' => $log->causer ? [
                        'name' => $log->causer->name,
                        'email' => $log->causer->email
                    ] : null,
                    'properties' => $props->toArray(),
                    'created_at' => $log->created_at->format('Y-m-d H:i:s'),
                ];
            }),
            'filters' => $filters,
        ]);
    }

    public function export(Request $request)
    {
        $filters = $request->only(['user', 'action', 'subject_type', 'search', 'start_date', 'end_date']);
        return Excel::download(new AuditLogsExport($filters), 'audit_logs.xlsx');
    }

    /**
     * Construire une query robuste (Index + Export doivent idéalement partager la même logique)
     */
    public function buildQuery(Request $request, array $filters)
    {
        $query = Activity::query()
            ->with('causer')
            ->orderBy('created_at', 'desc');

        // ---------------- USER ----------------
        if (!empty($filters['user'])) {
            $userInput = trim(strtolower($filters['user']));
            if ($userInput === '__system__') {
                $query->whereNull('causer_id');
            } else {
                $u = trim($filters['user']);
                $query->whereHas('causer', function ($q) use ($u) {
                    $q->where('name', 'like', '%' . $u . '%')
                      ->orWhere('email', 'like', '%' . $u . '%');
                });
            }
        }

        // ---------------- ACTION ----------------
        if (!empty($filters['action'])) {
            $action = trim($filters['action']);
            $query->where(function ($q) use ($action) {
                $q->where('event', $action)
                  ->orWhere('description', 'like', '%' . $action . '%');
            });
        }

        // ---------------- SUBJECT TYPE ----------------
        if (!empty($filters['subject_type'])) {
            $query->where('subject_type', $filters['subject_type']);
        }

        // ---------------- DATE RANGE ----------------
        if (!empty($filters['start_date'])) {
            $query->whereDate('created_at', '>=', $filters['start_date']);
        }
        if (!empty($filters['end_date'])) {
            $query->whereDate('created_at', '<=', $filters['end_date']);
        }

        // ---------------- GLOBAL SEARCH (ROBUST) ----------------
        if (!empty($filters['search'])) {
            $this->applyRobustSearch($query, (string) $filters['search']);
        }

        return $query;
    }

    /**
     * Recherche robuste :
     * - multi-termes en AND (chaque terme doit matcher quelque part)
     * - support field:value (user:, action:, subject:, id:, details:)
     * - recherche dans properties JSON (DÉTAILS)
     */
    private function applyRobustSearch($query, string $rawSearch): void
    {
        $rawSearch = trim($rawSearch);
        if ($rawSearch === '') return;

        // 1) Support field:value (ex: user:john, action:created, details:TEST)
        // Si on détecte un seul "champ:valeur" (simple), on l’applique en ciblé.
        $fielded = $this->parseFieldedSearch($rawSearch);
        if ($fielded) {
            [$field, $value] = $fielded;
            $this->applyFieldedSearch($query, $field, $value);
            return;
        }

        // 2) Sinon, recherche globale multi-termes (AND)
        $terms = $this->splitSearchTerms($rawSearch);

        foreach ($terms as $term) {
            $term = trim($term);
            if ($term === '') continue;

            $like = '%' . $this->escapeLike($term) . '%';

            // Chaque terme doit matcher (AND), mais dans n'importe quel champ (OR)
            $query->where(function ($q) use ($like) {
                $q->where('description', 'like', $like)
                  ->orWhere('event', 'like', $like)
                  ->orWhere('subject_type', 'like', $like)
                  ->orWhere('subject_id', 'like', $like)
                  ->orWhereHas('causer', function ($cq) use ($like) {
                      $cq->where('name', 'like', $like)
                         ->orWhere('email', 'like', $like);
                  })
                  // ✅ DÉTAILS : properties JSON / text
                  ->orWhereRaw($this->propertiesLikeSql(), [$like]);
            });
        }
    }

    private function parseFieldedSearch(string $s): ?array
    {
        // Exemples acceptés :
        // user:john
        // action:created
        // subject:App\Models\Employee
        // id:7
        // details:TEST
        // description:foo
        //
        // On évite de parser si ça ressemble à une phrase (ex: "test employé")
        if (!str_contains($s, ':')) return null;

        // Si plusieurs ":" (ex JSON), on ne tente pas une règle “simple”
        if (substr_count($s, ':') !== 1) return null;

        [$field, $value] = array_map('trim', explode(':', $s, 2));
        $field = trim($field, "\"' ");
        $value = trim($value, "\"' ");

        if ($field === '' || $value === '') return null;

        $allowed = ['user', 'action', 'subject', 'subject_type', 'id', 'subject_id', 'details', 'properties', 'description', 'event'];
        if (!in_array($field, $allowed, true)) return null;

        return [$field, $value];
    }

    private function applyFieldedSearch($query, string $field, string $value): void
    {
        $like = '%' . $this->escapeLike($value) . '%';

        switch ($field) {
            case 'user':
                $query->whereHas('causer', function ($cq) use ($like) {
                    $cq->where('name', 'like', $like)
                       ->orWhere('email', 'like', $like);
                });
                break;

            case 'action':
                $query->where(function ($q) use ($value, $like) {
                    $q->where('event', $value)
                      ->orWhere('description', 'like', $like);
                });
                break;

            case 'subject':
            case 'subject_type':
                $query->where('subject_type', 'like', $like);
                break;

            case 'id':
            case 'subject_id':
                $query->where('subject_id', 'like', $like);
                break;

            case 'description':
                $query->where('description', 'like', $like);
                break;

            case 'event':
                $query->where('event', 'like', $like);
                break;

            case 'details':
            case 'properties':
                // ✅ uniquement dans "Détails"
                $query->whereRaw($this->propertiesLikeSql(), [$like]);
                break;
        }
    }

    private function splitSearchTerms(string $s): array
    {
        // Support des guillemets pour phrases exactes:  "test employé"
        preg_match_all('/"([^"]+)"|\'([^\']+)\'|(\S+)/u', $s, $m);

        $out = [];
        foreach ($m[0] as $i => $_) {
            $out[] = $m[1][$i] ?: ($m[2][$i] ?: $m[3][$i]);
        }
        return array_values(array_filter($out, fn ($x) => trim((string)$x) !== ''));
    }

    private function escapeLike(string $value): string
    {
        // Échappe % et _ (LIKE wildcards)
        return addcslashes($value, "\\%_");
    }

    private function propertiesLikeSql(): string
    {
        $driver = DB::connection()->getDriverName();

        // Spatie stocke généralement properties en JSON (MySQL) ou text
        // On fait une approche “safe” et portable
        return match ($driver) {
            'pgsql' => "CAST(properties AS TEXT) ILIKE ?",
            default => "CAST(properties AS CHAR) LIKE ?",
        };
    }

    private function resolveSuperAdmin($auth): array
    {
        $isSuperAdmin = false;
        $modelTypes = [];

        if ($auth) {
            $modelTypes = array_values(array_unique(array_filter([
                method_exists($auth, 'getMorphClass') ? $auth->getMorphClass() : null,
                get_class($auth),
                'App\\Models\\User',
            ])));

            $isSuperAdmin = DB::table('model_has_roles')
                ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
                ->where('model_has_roles.model_id', $auth->id)
                ->whereIn('model_has_roles.model_type', $modelTypes)
                ->where('roles.name', 'SuperAdmin')
                ->exists();

            if (!$isSuperAdmin) {
                $isSuperAdmin = DB::table('model_has_roles')
                    ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
                    ->where('model_has_roles.model_id', $auth->id)
                    ->where('roles.name', 'SuperAdmin')
                    ->exists();
            }
        }

        return [$isSuperAdmin, $modelTypes];
    }
}
