<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Http\Resources\LeadResource;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    public function index(Request $request)
    {
        $query = Lead::with(['customer', 'assignee', 'unit']);

        if ($request->has('status')) {
            $query->where('status', $request->query('status'));
        }
        
        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->query('customer_id'));
        }

        return LeadResource::collection($query->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'unit_id' => 'nullable|exists:units,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'source' => 'nullable|string|max:255',
            'status' => 'nullable|string|in:new,contacted,qualified,proposal,won,lost',
            'expected_value' => 'nullable|numeric',
            'assigned_to' => 'nullable|exists:users,id',
            'active_project_id' => 'required|exists:projects,id',
        ]);

        $data['project_id'] = $data['active_project_id'];
        unset($data['active_project_id']);

        $lead = Lead::create($data);
        $lead->load(['customer', 'assignee', 'unit']);

        return new LeadResource($lead);
    }

    /**
     * Dış CRM'den (Başak CRM kanban export'u) toplu fırsat aktarımı.
     * Müşteriler telefon/e-posta üzerinden eşleştirilir (yoksa oluşturulur),
     * aynı başlıklı mevcut fırsatlar atlanır, not/yorumlar aktivite olarak eklenir.
     */
    public function import(Request $request)
    {
        $data = $request->validate([
            'rows'                  => 'required|array|min:1|max:2000',
            'rows.*.title'          => 'required|string|max:255',
            'rows.*.customer_name'  => 'nullable|string|max:255',
            'rows.*.phone'          => 'nullable|string|max:50',
            'rows.*.email'          => 'nullable|string|max:255',
            'rows.*.status'         => 'nullable|string|in:new,contacted,qualified,proposal,won,lost',
            'rows.*.stage_label'    => 'nullable|string|max:255',
            'rows.*.expected_value' => 'nullable|numeric',
            'rows.*.source'         => 'nullable|string|max:255',
            'rows.*.notes'          => 'nullable|string|max:20000',
            'rows.*.comments'       => 'nullable|string|max:40000',
            'rows.*.created_date'   => 'nullable|date',
        ]);

        $projectId = $request->active_project_id;
        $userId = $request->user()->id;

        $normalizePhone = function (?string $phone): ?string {
            if (!$phone) return null;
            $digits = preg_replace('/\D+/', '', $phone);
            if ($digits === '') return null;
            return strlen($digits) > 10 ? substr($digits, -10) : $digits;
        };

        $summary = [
            'leads_created'      => 0,
            'leads_skipped'      => 0,
            'customers_created'  => 0,
            'customers_matched'  => 0,
        ];

        \Illuminate\Support\Facades\DB::transaction(function () use ($data, $projectId, $userId, $normalizePhone, &$summary) {
            // Mevcut müşterileri bir kez çek, telefon/e-posta index'i kur
            $customers = \App\Models\Customer::where('project_id', $projectId)->get();
            $byPhone = [];
            $byEmail = [];
            foreach ($customers as $c) {
                if ($p = $normalizePhone($c->phone)) $byPhone[$p] = $c->id;
                if ($c->email) $byEmail[mb_strtolower(trim($c->email))] = $c->id;
            }

            $existingLeadTitles = Lead::where('project_id', $projectId)
                ->get(['title', 'customer_id'])
                ->map(fn($l) => mb_strtolower(trim($l->title)) . '|' . ($l->customer_id ?? ''))
                ->flip();

            foreach ($data['rows'] as $row) {
                $phoneKey = $normalizePhone($row['phone'] ?? null);
                $emailKey = isset($row['email']) && $row['email'] ? mb_strtolower(trim($row['email'])) : null;

                // ── Müşteri eşleştir / oluştur ──
                $customerId = null;
                if ($phoneKey && isset($byPhone[$phoneKey])) {
                    $customerId = $byPhone[$phoneKey];
                    $summary['customers_matched']++;
                } elseif ($emailKey && isset($byEmail[$emailKey])) {
                    $customerId = $byEmail[$emailKey];
                    $summary['customers_matched']++;
                } elseif (!empty($row['customer_name']) || $phoneKey || $emailKey) {
                    $nameParts = preg_split('/\s+/', trim($row['customer_name'] ?? ''), -1, PREG_SPLIT_NO_EMPTY) ?: [];
                    $lastName = count($nameParts) > 1 ? array_pop($nameParts) : null;
                    $firstName = count($nameParts) > 0 ? implode(' ', $nameParts) : ($row['customer_name'] ?? 'İsimsiz');

                    $customer = \App\Models\Customer::create([
                        'project_id' => $projectId,
                        'type'       => 'individual',
                        'first_name' => $firstName,
                        'last_name'  => $lastName,
                        'phone'      => $row['phone'] ?? null,
                        'email'      => $row['email'] ?? null,
                    ]);
                    $customerId = $customer->id;
                    $summary['customers_created']++;
                    if ($phoneKey) $byPhone[$phoneKey] = $customerId;
                    if ($emailKey) $byEmail[$emailKey] = $customerId;
                }

                // ── Aynı fırsat daha önce aktarıldıysa atla ──
                $leadKey = mb_strtolower(trim($row['title'])) . '|' . ($customerId ?? '');
                if (isset($existingLeadTitles[$leadKey])) {
                    $summary['leads_skipped']++;
                    continue;
                }

                $lead = new Lead([
                    'project_id'     => $projectId,
                    'customer_id'    => $customerId,
                    'title'          => $row['title'],
                    'status'         => $row['status'] ?? 'new',
                    'source'         => $row['source'] ?? 'Başak CRM',
                    'expected_value' => $row['expected_value'] ?? null,
                    'description'    => !empty($row['stage_label']) ? 'Başak CRM aşaması: ' . $row['stage_label'] : null,
                ]);
                if (!empty($row['created_date'])) {
                    $lead->created_at = $row['created_date'];
                }
                $lead->save();
                $existingLeadTitles[$leadKey] = true;
                $summary['leads_created']++;

                // ── Not ve yorumları aktivite olarak taşı ──
                foreach ([['Başak CRM Notu', $row['notes'] ?? null], ['Başak CRM Yorumları', $row['comments'] ?? null]] as [$subject, $body]) {
                    if ($body === null || trim((string) $body) === '') continue;
                    \App\Models\Activity::create([
                        'project_id'   => $projectId,
                        'lead_id'      => $lead->id,
                        'user_id'      => $userId,
                        'type'         => 'note',
                        'subject'      => $subject,
                        'notes'        => $body,
                        'is_completed' => true,
                    ]);
                }
            }
        });

        return response()->json([
            'message' => "{$summary['leads_created']} fırsat aktarıldı.",
            'summary' => $summary,
        ]);
    }

    public function show(Lead $lead)
    {
        $lead->load(['customer', 'assignee', 'unit', 'activities.user', 'offers']);
        return new LeadResource($lead);
    }

    public function update(Request $request, Lead $lead)
    {
        $data = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'unit_id' => 'nullable|exists:units,id',
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'source' => 'nullable|string|max:255',
            'status' => 'nullable|string|in:new,contacted,qualified,proposal,won,lost',
            'expected_value' => 'nullable|numeric',
            'assigned_to' => 'nullable|exists:users,id',
            'active_project_id' => 'nullable|exists:projects,id',
        ]);

        if (isset($data['active_project_id'])) {
            $data['project_id'] = $data['active_project_id'];
            unset($data['active_project_id']);
        }

        $lead->update($data);
        $lead->load(['customer', 'assignee', 'unit']);

        return new LeadResource($lead);
    }

    public function updateStatus(Request $request, Lead $lead)
    {
        $request->validate(['status' => 'required|string|in:new,contacted,qualified,proposal,won,lost']);
        $lead->update(['status' => $request->status]);
        
        return response()->json(['message' => 'Status updated successfully.']);
    }

    public function destroy(Lead $lead)
    {
        $lead->delete();
        return response()->noContent();
    }
}
