-- Nour HR System - Full Database Schema
-- Supabase Migration

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

create type user_role as enum (
  'admin', 'hr', 'accountant', 'control', 'manager', 'employee', 'area_manager', 'ceo'
);

create type request_status as enum ('pending', 'approved', 'rejected');

create type shift_status as enum ('open', 'closed', 'late');

create type evaluation_rate as enum ('excellent', 'good', 'weak');

-- ============================================================
-- CORE TABLES
-- ============================================================

-- Branches
create table branches (
  id bigint generated always as identity primary key,
  name text not null,
  address text,
  phone text,
  created_at timestamptz default now()
);

-- Banks
create table banks (
  id bigint generated always as identity primary key,
  name text not null,
  created_at timestamptz default now()
);

-- Profiles (extends Supabase auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text not null,
  role user_role not null default 'employee',
  is_active boolean default true,
  employee_id bigint,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Employees
create table employees (
  id bigint generated always as identity primary key,
  full_name text not null,
  national_id text,
  phone text,
  email text,
  address text,
  birth_date date,
  hire_date date not null default current_date,
  job_title text,
  department text,
  salary numeric(12,2) default 0,
  housing_allowance numeric(12,2) default 0,
  transport_allowance numeric(12,2) default 0,
  other_allowance numeric(12,2) default 0,
  branch_id bigint references branches(id),
  bank_id bigint references banks(id),
  bank_account text,
  role user_role default 'employee',
  is_active boolean default true,
  end_of_service_date date,
  end_of_service_reason text,
  notes text,
  photo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Link profiles to employees
alter table profiles add constraint fk_profiles_employee
  foreign key (employee_id) references employees(id);

-- Area Manager <-> Branches (M2M)
create table area_manager_branches (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id) on delete cascade,
  branch_id bigint references branches(id) on delete cascade,
  unique(user_id, branch_id)
);

-- ============================================================
-- ATTENDANCE & SCHEDULES
-- ============================================================

create table schedules (
  id bigint generated always as identity primary key,
  employee_id bigint references employees(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_off boolean default false,
  created_at timestamptz default now()
);

create table attendance (
  id bigint generated always as identity primary key,
  employee_id bigint references employees(id) on delete cascade,
  start_time timestamptz,
  end_time timestamptz,
  status shift_status default 'open',
  is_late boolean default false,
  late_minutes int default 0,
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- PAYROLL
-- ============================================================

create table monthly_payroll (
  id bigint generated always as identity primary key,
  employee_id bigint references employees(id) on delete cascade,
  month int not null check (month between 1 and 12),
  year int not null,
  base_salary numeric(12,2) default 0,
  total_allowances numeric(12,2) default 0,
  total_deductions numeric(12,2) default 0,
  total_bonuses numeric(12,2) default 0,
  net_salary numeric(12,2) default 0,
  working_days int default 0,
  absent_days int default 0,
  late_days int default 0,
  overtime_hours numeric(6,2) default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(employee_id, month, year)
);

create table discounts (
  id bigint generated always as identity primary key,
  employee_id bigint references employees(id) on delete cascade,
  amount numeric(12,2) not null,
  reason text,
  month int,
  year int,
  is_contract boolean default false,
  created_at timestamptz default now()
);

create table bonuses (
  id bigint generated always as identity primary key,
  employee_id bigint references employees(id) on delete cascade,
  amount numeric(12,2) not null,
  reason text,
  month int,
  year int,
  created_at timestamptz default now()
);

create table cash_borrows (
  id bigint generated always as identity primary key,
  employee_id bigint references employees(id) on delete cascade,
  amount numeric(12,2) not null,
  reason text,
  month int,
  year int,
  created_at timestamptz default now()
);

create table installment_borrows (
  id bigint generated always as identity primary key,
  employee_id bigint references employees(id) on delete cascade,
  total_amount numeric(12,2) not null,
  monthly_installment numeric(12,2) not null,
  remaining_amount numeric(12,2) not null,
  start_month int,
  start_year int,
  is_active boolean default true,
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- EVALUATIONS
-- ============================================================

create table evaluation_criteria (
  id bigint generated always as identity primary key,
  name text not null,
  description text,
  created_at timestamptz default now()
);

create table evaluations (
  id bigint generated always as identity primary key,
  employee_id bigint references employees(id) on delete cascade,
  evaluator_id uuid references profiles(id),
  criteria_id bigint references evaluation_criteria(id),
  rate evaluation_rate not null,
  notes text,
  period_month int,
  period_year int,
  created_at timestamptz default now()
);

-- ============================================================
-- ORDERS / REQUESTS
-- ============================================================

-- Holidays
create table holidays (
  id bigint generated always as identity primary key,
  employee_id bigint references employees(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text,
  status request_status default 'pending',
  hr_approved boolean,
  hr_approved_by uuid references profiles(id),
  hr_approved_at timestamptz,
  area_manager_approved boolean,
  area_manager_approved_by uuid references profiles(id),
  area_manager_approved_at timestamptz,
  rejection_reason text,
  is_seen_by_hr boolean default false,
  created_at timestamptz default now()
);

-- Borrows (requests)
create table borrow_requests (
  id bigint generated always as identity primary key,
  employee_id bigint references employees(id) on delete cascade,
  amount numeric(12,2) not null,
  reason text,
  status request_status default 'pending',
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  rejection_reason text,
  is_seen_by_hr boolean default false,
  created_at timestamptz default now()
);

-- Overtime
create table overtime_requests (
  id bigint generated always as identity primary key,
  employee_id bigint references employees(id) on delete cascade,
  date date not null,
  hours numeric(4,2) not null,
  reason text,
  status request_status default 'pending',
  hr_approved boolean,
  hr_approved_by uuid references profiles(id),
  hr_approved_at timestamptz,
  area_manager_approved boolean,
  area_manager_approved_by uuid references profiles(id),
  area_manager_approved_at timestamptz,
  control_approved boolean,
  control_approved_by uuid references profiles(id),
  control_approved_at timestamptz,
  rejection_reason text,
  is_seen_by_hr boolean default false,
  created_at timestamptz default now()
);

-- Resignations
create table resignations (
  id bigint generated always as identity primary key,
  employee_id bigint references employees(id) on delete cascade,
  reason text,
  requested_date date not null default current_date,
  status request_status default 'pending',
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  rejection_reason text,
  is_seen_by_hr boolean default false,
  created_at timestamptz default now()
);

-- Appointments
create table appointments (
  id bigint generated always as identity primary key,
  employee_id bigint references employees(id) on delete cascade,
  date date not null,
  time time,
  reason text,
  status request_status default 'pending',
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  rejection_reason text,
  is_seen_by_hr boolean default false,
  created_at timestamptz default now()
);

-- Forgotten Hours
create table forgotten_hours (
  id bigint generated always as identity primary key,
  employee_id bigint references employees(id) on delete cascade,
  date date not null,
  start_time time,
  end_time time,
  reason text,
  status request_status default 'pending',
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  rejection_reason text,
  is_seen_by_hr boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- COMPLAINTS
-- ============================================================

create table complaints (
  id bigint generated always as identity primary key,
  employee_id bigint references employees(id) on delete cascade,
  subject text not null,
  body text not null,
  response text,
  responded_by uuid references profiles(id),
  responded_at timestamptz,
  is_seen boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- CUSTODY / RESPONSIBILITIES
-- ============================================================

create table custody_items (
  id bigint generated always as identity primary key,
  employee_id bigint references employees(id) on delete cascade,
  item_name text not null,
  description text,
  quantity int default 1,
  assigned_date date default current_date,
  created_at timestamptz default now()
);

-- ============================================================
-- NEWS & ADS
-- ============================================================

create table news (
  id bigint generated always as identity primary key,
  title text not null,
  body text,
  source text,
  image_url text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ============================================================
-- AUDIT LOG
-- ============================================================

create table audit_logs (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id),
  action text not null,
  entity text,
  entity_id text,
  details jsonb,
  created_at timestamptz default now()
);

-- ============================================================
-- EMPLOYEE BRANCH HISTORY
-- ============================================================

create table employee_branch_history (
  id bigint generated always as identity primary key,
  employee_id bigint references employees(id) on delete cascade,
  branch_id bigint references branches(id),
  start_date date not null default current_date,
  end_date date,
  created_at timestamptz default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_employees_branch on employees(branch_id);
create index idx_employees_bank on employees(bank_id);
create index idx_employees_role on employees(role);
create index idx_attendance_employee on attendance(employee_id);
create index idx_attendance_date on attendance(created_at);
create index idx_monthly_payroll_period on monthly_payroll(month, year);
create index idx_holidays_employee on holidays(employee_id);
create index idx_holidays_status on holidays(status);
create index idx_overtime_employee on overtime_requests(employee_id);
create index idx_complaints_employee on complaints(employee_id);
create index idx_audit_logs_user on audit_logs(user_id);
create index idx_audit_logs_created on audit_logs(created_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table employees enable row level security;
alter table branches enable row level security;
alter table banks enable row level security;
alter table area_manager_branches enable row level security;
alter table schedules enable row level security;
alter table attendance enable row level security;
alter table monthly_payroll enable row level security;
alter table discounts enable row level security;
alter table bonuses enable row level security;
alter table cash_borrows enable row level security;
alter table installment_borrows enable row level security;
alter table evaluation_criteria enable row level security;
alter table evaluations enable row level security;
alter table holidays enable row level security;
alter table borrow_requests enable row level security;
alter table overtime_requests enable row level security;
alter table resignations enable row level security;
alter table appointments enable row level security;
alter table forgotten_hours enable row level security;
alter table complaints enable row level security;
alter table custody_items enable row level security;
alter table news enable row level security;
alter table audit_logs enable row level security;
alter table employee_branch_history enable row level security;

-- Helper function to get current user's role
create or replace function get_user_role()
returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql security definer stable;

-- Helper function to get current user's employee_id
create or replace function get_user_employee_id()
returns bigint as $$
  select employee_id from profiles where id = auth.uid();
$$ language sql security definer stable;

-- Admin/HR can see everything
create policy "admin_hr_full_access" on profiles
  for all using (get_user_role() in ('admin', 'hr'));

create policy "users_read_own_profile" on profiles
  for select using (id = auth.uid());

-- Employees: admin/hr full access, others see own branch
create policy "admin_hr_employees" on employees
  for all using (get_user_role() in ('admin', 'hr'));

create policy "employees_read_own" on employees
  for select using (id = get_user_employee_id());

-- Branches: readable by all authenticated, writable by admin/hr
create policy "branches_read" on branches
  for select using (auth.uid() is not null);

create policy "branches_write" on branches
  for all using (get_user_role() in ('admin', 'hr'));

-- Banks: readable by all authenticated, writable by admin/hr
create policy "banks_read" on banks
  for select using (auth.uid() is not null);

create policy "banks_write" on banks
  for all using (get_user_role() in ('admin', 'hr'));

-- Attendance: admin/hr see all, employees see own
create policy "attendance_admin" on attendance
  for all using (get_user_role() in ('admin', 'hr', 'control'));

create policy "attendance_own" on attendance
  for select using (employee_id = get_user_employee_id());

create policy "attendance_insert_own" on attendance
  for insert with check (employee_id = get_user_employee_id());

-- Payroll: admin/hr/accountant see all, employees see own
create policy "payroll_admin" on monthly_payroll
  for all using (get_user_role() in ('admin', 'hr', 'accountant'));

create policy "payroll_own" on monthly_payroll
  for select using (employee_id = get_user_employee_id());

-- Discounts/Bonuses: admin/hr/accountant manage
create policy "discounts_admin" on discounts
  for all using (get_user_role() in ('admin', 'hr', 'accountant'));

create policy "bonuses_admin" on bonuses
  for all using (get_user_role() in ('admin', 'hr', 'accountant'));

create policy "cash_borrows_admin" on cash_borrows
  for all using (get_user_role() in ('admin', 'hr', 'accountant'));

create policy "installments_admin" on installment_borrows
  for all using (get_user_role() in ('admin', 'hr', 'accountant'));

-- Orders: admin/hr see all, employees see own, can insert own
create policy "holidays_admin" on holidays
  for all using (get_user_role() in ('admin', 'hr', 'area_manager'));

create policy "holidays_own" on holidays
  for select using (employee_id = get_user_employee_id());

create policy "holidays_insert" on holidays
  for insert with check (employee_id = get_user_employee_id());

create policy "borrows_admin" on borrow_requests
  for all using (get_user_role() in ('admin', 'hr'));

create policy "borrows_own" on borrow_requests
  for select using (employee_id = get_user_employee_id());

create policy "borrows_insert" on borrow_requests
  for insert with check (employee_id = get_user_employee_id());

create policy "overtime_admin" on overtime_requests
  for all using (get_user_role() in ('admin', 'hr', 'area_manager', 'control'));

create policy "overtime_own" on overtime_requests
  for select using (employee_id = get_user_employee_id());

create policy "overtime_insert" on overtime_requests
  for insert with check (employee_id = get_user_employee_id());

create policy "resignations_admin" on resignations
  for all using (get_user_role() in ('admin', 'hr'));

create policy "resignations_own" on resignations
  for select using (employee_id = get_user_employee_id());

create policy "resignations_insert" on resignations
  for insert with check (employee_id = get_user_employee_id());

create policy "appointments_admin" on appointments
  for all using (get_user_role() in ('admin', 'hr'));

create policy "appointments_own" on appointments
  for select using (employee_id = get_user_employee_id());

create policy "appointments_insert" on appointments
  for insert with check (employee_id = get_user_employee_id());

create policy "forgotten_hours_admin" on forgotten_hours
  for all using (get_user_role() in ('admin', 'hr'));

create policy "forgotten_hours_own" on forgotten_hours
  for select using (employee_id = get_user_employee_id());

create policy "forgotten_hours_insert" on forgotten_hours
  for insert with check (employee_id = get_user_employee_id());

-- Complaints
create policy "complaints_admin" on complaints
  for all using (get_user_role() in ('admin', 'hr'));

create policy "complaints_own" on complaints
  for select using (employee_id = get_user_employee_id());

create policy "complaints_insert" on complaints
  for insert with check (employee_id = get_user_employee_id());

-- Custody
create policy "custody_admin" on custody_items
  for all using (get_user_role() in ('admin', 'hr'));

create policy "custody_own" on custody_items
  for select using (employee_id = get_user_employee_id());

-- News: readable by all, writable by admin/hr
create policy "news_read" on news
  for select using (auth.uid() is not null);

create policy "news_write" on news
  for all using (get_user_role() in ('admin', 'hr'));

-- Audit: readable by admin only
create policy "audit_admin" on audit_logs
  for all using (get_user_role() = 'admin');

-- Schedules
create policy "schedules_admin" on schedules
  for all using (get_user_role() in ('admin', 'hr'));

create policy "schedules_own" on schedules
  for select using (employee_id = get_user_employee_id());

-- Evaluations
create policy "evaluations_admin" on evaluations
  for all using (get_user_role() in ('admin', 'hr'));

create policy "evaluations_own" on evaluations
  for select using (employee_id = get_user_employee_id());

create policy "criteria_read" on evaluation_criteria
  for select using (auth.uid() is not null);

create policy "criteria_write" on evaluation_criteria
  for all using (get_user_role() in ('admin', 'hr'));

-- Area manager branches
create policy "amb_admin" on area_manager_branches
  for all using (get_user_role() in ('admin', 'hr'));

create policy "amb_own" on area_manager_branches
  for select using (user_id = auth.uid());

-- Employee branch history
create policy "ebh_admin" on employee_branch_history
  for all using (get_user_role() in ('admin', 'hr'));

create policy "ebh_own" on employee_branch_history
  for select using (employee_id = get_user_employee_id());

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tr_profiles_updated
  before update on profiles
  for each row execute function update_updated_at();

create trigger tr_employees_updated
  before update on employees
  for each row execute function update_updated_at();

create trigger tr_monthly_payroll_updated
  before update on monthly_payroll
  for each row execute function update_updated_at();

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, username, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', new.email),
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'employee')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
