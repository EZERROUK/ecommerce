<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class DepartmentResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'                       => $this->id,
            'name'                     => $this->name,
            'description'              => $this->description,
            'department_head'          => $this->department_head,
            'department_head_full_name'=> $this->department_head_full_name,
            'created_by'               => $this->created_by,
            'created_at'               => optional($this->created_at)?->format('Y-m-d H:i'),
            'updated_at'               => optional($this->updated_at)?->format('Y-m-d H:i'),
            'deleted_at'               => optional($this->deleted_at)?->format('Y-m-d H:i'),

            'head' => $this->whenLoaded('head', fn () => [
                'id'        => $this->head?->id,
                'full_name' => $this->head?->full_name,
            ]),

            'employees_count' => $this->whenCounted('employees'),
        ];
    }
}
