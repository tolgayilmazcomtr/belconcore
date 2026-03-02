<?php

namespace App\Http\Controllers;

use App\Models\TemplateConfig;
use Illuminate\Http\Request;

class TemplateConfigController extends Controller
{
    /**
     * Get template config for a project and type.
     * If none exists, return sensible defaults.
     */
    public function show(Request $request, string $type)
    {
        $projectId = $request->input('project_id') ?? $request->user()->current_project_id;

        $config = TemplateConfig::where('type', $type)
            ->where(function ($q) use ($projectId) {
                $q->where('project_id', $projectId)->orWhereNull('project_id');
            })
            ->orderByRaw('project_id IS NULL ASC') // project-specific first
            ->first();

        if (!$config) {
            // Return default blocks for this type
            return response()->json([
                'data' => [
                    'id' => null,
                    'type' => $type,
                    'name' => 'Varsayılan Şablon',
                    'project_id' => $projectId,
                    'blocks' => $this->defaultBlocks($type),
                    'page_settings' => ['margin' => 14, 'font_size' => 9],
                ]
            ]);
        }

        return response()->json(['data' => $config]);
    }

    /**
     * Save (create or update) template config.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_id'    => 'nullable|exists:projects,id',
            'type'          => 'required|string|in:offer,invoice',
            'name'          => 'nullable|string|max:255',
            'blocks'        => 'required|array',
            'page_settings' => 'nullable|array',
        ]);

        $config = TemplateConfig::updateOrCreate(
            [
                'project_id' => $validated['project_id'] ?? null,
                'type'       => $validated['type'],
            ],
            [
                'name'          => $validated['name'] ?? 'Varsayılan Şablon',
                'blocks'        => $validated['blocks'],
                'page_settings' => $validated['page_settings'] ?? ['margin' => 14, 'font_size' => 9],
                'is_default'    => true,
            ]
        );

        return response()->json(['message' => 'Şablon kaydedildi.', 'data' => $config]);
    }

    private function defaultBlocks(string $type): array
    {
        if ($type === 'offer') {
            return [
                ['id' => 'logo',       'type' => 'LogoBlock',      'settings' => ['align' => 'left']],
                ['id' => 'divider1',   'type' => 'DividerBlock',   'settings' => ['thickness' => 2, 'color' => '#0f172a']],
                ['id' => 'info_grid',  'type' => 'InfoGridBlock',  'settings' => []],
                ['id' => 'pricing',    'type' => 'PricingTableBlock', 'settings' => []],
                ['id' => 'validity',   'type' => 'ValidityBlock',  'settings' => []],
                ['id' => 'payment',    'type' => 'PaymentPlanBlock', 'settings' => []],
                ['id' => 'notes',      'type' => 'NotesBlock',     'settings' => []],
                ['id' => 'signature',  'type' => 'SignatureBlock',  'settings' => ['columns' => 3]],
                ['id' => 'footer',     'type' => 'FooterBlock',    'settings' => []],
            ];
        }
        return [];
    }
}
