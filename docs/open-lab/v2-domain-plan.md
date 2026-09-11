# Open Lab domain — prepared, not applied

The requested `https://openlab.plrd.org` is supported by Vercel. As checked September 11, 2026, that hostname does not currently resolve. No domain, DNS, production branch, alias, or certificate configuration was changed in this pass.

## The small safe change

1. In the existing PLRD Vercel project, add **only** `openlab.plrd.org`. Preserve `plrd.org`, `www.plrd.org`, their existing assignments, nameservers, and email records.
2. For an unreleased pilot, assign the new domain to the approved preview branch/environment, not production. Vercel supports explicit Git-branch domain assignment. Get the exact project-specific CNAME target from its Domains panel; do not copy an example or replace nameservers.
3. Add the one subdomain CNAME at the authoritative DNS provider. Wait for the project to confirm DNS and HTTPS certificate validity, then verify the public hostname directly.
4. Configure that environment's exact Open Lab OAuth identity to this HTTPS origin, serve the metadata/callback publicly without a redirect/access wall, and keep unrelated aliases from accepting that identity. The v2 default preview path uses Vercel's trusted generated branch URL; a dedicated custom preview domain is a separate explicit origin configuration and test, not an arbitrary Host-header fallback.
5. Route the subdomain's `/` entry into `/lab/`; initially retaining `/lab/.../` route paths on this host avoids changing every internal route and AT record identifier in one DNS change. A later root-path cleanup can be separate. Do not change the stable AT community marker merely because the display domain changes.
6. After owner-approved account testing, update the PLRD home invitation to the new origin. Keep preview/noindex and production publication decisions separate. Existing browser-local drafts and OAuth grants do not migrate across origins automatically; offer export and require fresh login, never silently discard old drafts.

## Rollback and gates

Approval is required for the exact domain assignment/DNS write. Production homepage links are not changed until the destination and login are verified. Rollback is removal of the newly added subdomain assignment/record, preserving all existing apex and `www` records; no main-branch merge is implied. Recheck anonymous landing, metadata HTTP 200/JSON, callback return-to behavior, reload/logout, and legacy PLRD/CMS paths before declaring the domain usable.

Sources inspected this turn:
- https://vercel.com/docs/domains/working-with-domains/add-a-domain — subdomains, project-specific CNAME, certificate/configuration validation.
- https://vercel.com/docs/domains/working-with-domains/assign-domain-to-a-git-branch — a domain can target a Preview environment and explicit branch.

This is a configuration plan, not evidence that DNS or OAuth was changed.
