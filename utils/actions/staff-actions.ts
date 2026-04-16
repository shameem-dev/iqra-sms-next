
import { createClient } from '../supabase/client';
const supabase = createClient();
import type { Staff, StaffFormData, LeaveType } from '@/type/staff';

// ─── FETCH ALL STAFF ─────────────────────────────────────────────────────────
export async function getAllStaff(): Promise<Staff[]> {
  const { data, error } = await supabase
    .from('staff')
    .select(`
      *,
      trainings:staff_trainings(*),
      projects:staff_projects(*),
      leaves:staff_leaves(*)
    `)
    .order('name');

  if (error) throw error;
  return data || [];
}

// ─── FETCH SINGLE STAFF ───────────────────────────────────────────────────────
export async function getStaffById(id: string): Promise<Staff | null> {
  const { data, error } = await supabase
    .from('staff')
    .select(`
      *,
      trainings:staff_trainings(*),
      projects:staff_projects(*),
      leaves:staff_leaves(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

// ─── CREATE STAFF ─────────────────────────────────────────────────────────────
export async function createStaff(formData: StaffFormData): Promise<Staff> {
  const {
    trainings_outside,
    trainings_iqrah,
    projects,
    leaves,
    ...staffData
  } = formData;

  // Insert main staff record
  const { data: newStaff, error: staffError } = await supabase
    .from('staff')
    .insert([{
      ...staffData,
      basic_salary: Number(staffData.basic_salary) || 0,
      ta: Number(staffData.ta) || 0,
      medical_used: Number(staffData.medical_used) || 0,
      medical_remaining: Number(staffData.medical_remaining) || 0,
      date_of_birth: staffData.date_of_birth || null,
      date_joined: staffData.date_joined || null,
      date_left: staffData.date_left || null,
    }])
    .select()
    .single();

  if (staffError) throw staffError;

  const staffId = newStaff.id;

  // Insert trainings (outside)
  if (trainings_outside.length > 0) {
    const { error } = await supabase.from('staff_trainings').insert(
      trainings_outside.filter(t => t.trim()).map((t) => ({
        staff_id: staffId,
        training_name: t,
        source: 'outside',
      }))
    );
    if (error) throw error;
  }

  // Insert trainings (iqrah)
  if (trainings_iqrah.length > 0) {
    const { error } = await supabase.from('staff_trainings').insert(
      trainings_iqrah.filter(t => t.trim()).map((t) => ({
        staff_id: staffId,
        training_name: t,
        source: 'iqrah',
      }))
    );
    if (error) throw error;
  }

  // Insert projects
  if (projects.length > 0) {
    const { error } = await supabase.from('staff_projects').insert(
      projects.filter(p => p.trim()).map((p) => ({
        staff_id: staffId,
        project_name: p,
      }))
    );
    if (error) throw error;
  }

  // Insert leaves
  const leaveTypes: LeaveType[] = ['annual', 'casual', 'commuted', 'sick', 'other'];
  const leaveRows = leaveTypes.map((type) => ({
    staff_id: staffId,
    leave_type: type,
    days_used: Number(leaves[`${type}_used` as keyof typeof leaves]) || 0,
    days_remaining: Number(leaves[`${type}_remaining` as keyof typeof leaves]) || 0,
    year: new Date().getFullYear(),
  }));

  const { error: leaveError } = await supabase.from('staff_leaves').insert(leaveRows);
  if (leaveError) throw leaveError;

  return newStaff;
}

// ─── UPDATE STAFF ─────────────────────────────────────────────────────────────
export async function updateStaff(id: string, formData: StaffFormData): Promise<Staff> {
  const {
    trainings_outside,
    trainings_iqrah,
    projects,
    leaves,
    ...staffData
  } = formData;

  // Update main staff record
  const { data: updated, error: staffError } = await supabase
    .from('staff')
    .update({
      ...staffData,
      basic_salary: Number(staffData.basic_salary) || 0,
      ta: Number(staffData.ta) || 0,
      medical_used: Number(staffData.medical_used) || 0,
      medical_remaining: Number(staffData.medical_remaining) || 0,
      date_of_birth: staffData.date_of_birth || null,
      date_joined: staffData.date_joined || null,
      date_left: staffData.date_left || null,
    })
    .eq('id', id)
    .select()
    .single();

  if (staffError) throw staffError;

  // Replace trainings
  await supabase.from('staff_trainings').delete().eq('staff_id', id);

  const allTrainings = [
    ...trainings_outside.filter(t => t.trim()).map(t => ({ staff_id: id, training_name: t, source: 'outside' as const })),
    ...trainings_iqrah.filter(t => t.trim()).map(t => ({ staff_id: id, training_name: t, source: 'iqrah' as const })),
  ];
  if (allTrainings.length > 0) {
    await supabase.from('staff_trainings').insert(allTrainings);
  }

  // Replace projects
  await supabase.from('staff_projects').delete().eq('staff_id', id);
  const allProjects = projects.filter(p => p.trim()).map(p => ({ staff_id: id, project_name: p }));
  if (allProjects.length > 0) {
    await supabase.from('staff_projects').insert(allProjects);
  }

  // Upsert leaves
  const leaveTypes: LeaveType[] = ['annual', 'casual', 'commuted', 'sick', 'other'];
  const year = new Date().getFullYear();
  for (const type of leaveTypes) {
    await supabase.from('staff_leaves').upsert({
      staff_id: id,
      leave_type: type,
      days_used: Number(leaves[`${type}_used` as keyof typeof leaves]) || 0,
      days_remaining: Number(leaves[`${type}_remaining` as keyof typeof leaves]) || 0,
      year,
    }, { onConflict: 'staff_id,leave_type,year' });
  }

  return updated;
}

// ─── DELETE STAFF ─────────────────────────────────────────────────────────────
export async function deleteStaff(id: string): Promise<void> {
  const { error } = await supabase.from('staff').delete().eq('id', id);
  if (error) throw error;
}

// ─── SEARCH STAFF ─────────────────────────────────────────────────────────────
export async function searchStaff(query: string): Promise<Staff[]> {
  const { data, error } = await supabase
    .from('staff')
    .select(`*, trainings:staff_trainings(*), projects:staff_projects(*), leaves:staff_leaves(*)`)
    .or(`name.ilike.%${query}%,designation.ilike.%${query}%,department.ilike.%${query}%`)
    .order('name');

  if (error) throw error;
  return data || [];
}