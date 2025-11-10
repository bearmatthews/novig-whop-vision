-- Create public bucket for team logos
insert into storage.buckets (id, name, public)
values ('team-logos', 'team-logos', true)
on conflict (id) do nothing;

-- Public read access for team logos
create policy "Public read team logos"
on storage.objects for select
using (bucket_id = 'team-logos');

-- Service role full access to manage cached logos
create policy "Service role manage team logos"
on storage.objects for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');