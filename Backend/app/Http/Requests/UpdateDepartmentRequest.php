<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDepartmentRequest extends FormRequest
{
    /**
     * Déterminer si l'utilisateur est autorisé à faire cette demande.
     *
     * @return bool
     */
    public function authorize()
    {
        // Vous pouvez ajouter une logique d'autorisation si nécessaire
        return true;
    }

    /**
     * Obtenez les règles de validation qui s'appliquent à la demande.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('departments', 'name')
                    ->whereNull('deleted_at')
                    ->ignore($this->department->id),
            ],
            'description' => ['nullable', 'string'],
            'department_head' => ['nullable', 'exists:employees,id'],
        ];
    }

    /**
     * Obtenez les messages de validation personnalisés.
     *
     * @return array
     */
    public function messages()
    {
        return [
            'name.required' => 'Le nom du département est requis.',
            'name.string' => 'Le nom du département doit être une chaîne de caractères.',
            'name.max' => 'Le nom du département ne peut pas dépasser 255 caractères.',
            'department_head.exists' => 'Le chef de département doit être un employé existant.',
            'description.max' => 'La description ne peut pas dépasser 255 caractères.',
        ];
    }
}
