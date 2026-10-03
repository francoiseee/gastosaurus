-- Join-by-link: every group gets a short random code. The "Share Invite Link"
-- card shows  <app>/?join=<code> ; anyone logged in who opens it joins the
-- group. Admins can rotate the code to invalidate old links.

alter table public.groups
  add column invite_code varchar(16) not null
    default substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);

alter table public.groups add constraint groups_invite_code_key unique (invite_code);
