# Tools, Resources, SEO & Trademarks

Curated tools the author actually uses, plus the SEO and trademark checks to run before committing. Tools change — the book's live list is at https://getdomainbook.com/resources.

## Contents
- [Registrars](#registrars)
- [WHOIS tools](#whois-tools)
- [Backordering & expired domains](#backordering--expired-domains)
- [Domain idea tools](#domain-idea-tools)
- [Marketplaces](#marketplaces)
- [Valuation & transactions](#valuation--transactions)
- [Community & news](#community--news)
- [SEO considerations](#seo-considerations)
- [Trademark considerations](#trademark-considerations)

## Registrars

All registrars are ICANN-accredited, so core functionality is similar; they differ on pricing, TLD support, support quality, and upsells.

- **Cloudflare Registrar** — author's current favorite. At-cost pricing (no profit margin), great support, API access. Downside: fewer TLDs, and occasionally a TLD's base fee is higher there. https://www.cloudflare.com/products/registrar/
- **Namecheap** — previous favorite, still highly recommended. Competitive prices, good support, wide TLD support, no annoying upsells. Go-to when Cloudflare lacks a TLD. https://www.namecheap.com
- **Name.com** — part of Identity Digital (owns many newer TLDs like .chat, .domains, .ninja). Useful for TLDs others lack; author uses it for .jobs. https://www.name.com
- **GoDaddy** — largest by far. Author avoids it (upsells, confusing UI, questionable ethics/security record) but it's unavoidable since so many domains live there. https://www.godaddy.com
- **Network Solutions** — one of the earliest; common for legacy domains. Transfer away ASAP (poor support, high prices). https://www.networksolutions.com

## WHOIS tools

WHOIS = the protocol to look up a domain's owner, registration/expiry dates, and registrar. Essential for acquisition research.

- **`whois` command** — built into most OSes. `whois example.com` for current details from official servers. Use this first when you have shell access.
- **WhoisXML API** — tracks WHOIS **over time**, so you can find **historical** records (often exposing an owner hidden behind today's privacy protection). Affordable credit system + API. https://www.whoisxmlapi.com
- **Registrar WHOIS pages** — sometimes add features (GoDaddy's includes a contact form to reach the owner). Approach: find the registrar via a generic WHOIS, then use that registrar's own page.
  - https://www.namecheap.com/domains/whois/
  - https://www.godaddy.com/whois
  - https://www.name.com/whois-lookup
  - https://www.networksolutions.com/domains/whois

## Backordering & expired domains

Backorders are usually free (pay only on success), so use **multiple** services. Each has exclusive partnerships with different registrars — match the service to the domain's current registrar (from WHOIS).

- **SnapNames** — most popular. Free backorder; if multiple people want it, auction (highest bidder wins, only winner pays). Dated UI but effective. Note: bidding needs a **verified account** (a few days) — start early. https://www.snapnames.com
- **GoDaddy Auctions** — GoDaddy gets first dibs on its own expiring domains; phased out backorders in 2024 but the auctions platform gets tens of thousands of expiring domains daily. https://www.godaddy.com/auctions/domain-auctions
- **Park.io** — started catching expiring .io; now many alt TLDs, clean interface. https://park.io
- **Dynadot** — backordering + large expiring catalog, good filters, useful API. https://www.dynadot.com
- **Sav** — active expiring-auction marketplace with solid filtering. https://www.sav.com/domains/auctions

## Domain idea tools

- **Domainr** — best for domain hacks and creative TLD combos; type a word, see options across hundreds of TLDs incl. synonyms. https://domainr.com
- **Namecheap Bulk Domain Search** — check 1,000+ TLDs at once ("beast mode," all TLDs, hide unavailable). Found handle.horse, followup.fish. https://www.namecheap.com/domains/bulk-domain-search/
- **AI chatbots** (ChatGPT, Claude, Grok) — generate keywords, synonyms, associations, invented words; give seeds and ask for more.
- **OneLook** — search words that start/end with specific letters (great for matching a TLD). https://www.onelook.com
- **Thesaurus** — synonyms when the obvious words are taken. https://www.thesaurus.com
- **One Word Domains** — curated available single-word domains + secondary market. https://oneword.domains

## Marketplaces

Same domain can be listed on several at different prices — check more than one.

- **Sedo** — oldest/largest; huge inventory (some low-quality). Powerful filters (dictionary words, max price, exclude dashes/numbers). https://sedo.com
- **Afternic** — owned by GoDaddy; millions of listings. Many "no-price" for-sale pages are Afternic-powered — search Afternic directly for the real asking price. Offers lease-to-own. https://www.afternic.com
- **Sav** — growing marketplace, wide range. https://www.sav.com
- **Atom** (formerly Squadhelp) — curated brandable names, often with logos; higher prices, less sifting. https://www.atom.com
- **Brandbucket** — curated brandable names at premium prices. https://www.brandbucket.com

## Valuation & transactions

- **NameBio** — database of historical sales; essential for appraising via comps (paid membership for full access). https://namebio.com
- **Escrow.com** — standard for secure transactions; protects both sides (see escrow flow in `acquiring.md`). https://www.escrow.com
- **DomainAgents** — semi-automated brokerage; finds/contacts owner, small fee + commission. https://domainagents.com
- **Domain.io** — manage your own listings across marketplaces; auto landing pages for domains you're selling. https://domain.io

## Community & news

- **Domain Name Wire** — industry news blog + podcast (sales, TLDs, legal, pricing). https://domainnamewire.com
- **Domain Investing** — industry news/trends blog. https://domaininvesting.com
- **NamePros** — largest community forum; noisy but great for specific questions. https://www.namepros.com

## SEO considerations

If a meaningful share of traffic will come from search, weigh these:

- **TLD & geo-targeting.** A ccTLD like `.de` makes search engines assume you target that country — use a generic TLD for an international audience. But `.co`, `.io`, and `.ai` are so widely used that **Google treats them as generic** (safe for international). Google's generic-ccTLD list: https://getdomainbook.com/resources/gcctld
- **Backlinks.** Not a top priority, but real. For previously-used domains, check existing backlinks with Ahrefs/SEMrush/Moz. High-quality, relevant backlinks give a head start; **spammy backlinks can hurt** — check before buying.
- **Domain history.** Check the Wayback Machine (what it was used for) and historical WHOIS (who owned it). Check blacklisting via Google Safe Browsing (https://transparencyreport.google.com/safe-browsing/search) and MXToolBox (https://mxtoolbox.com/blacklists.aspx). If blacklisted, avoid.
- **Exact Match Domains (EMD)** — e.g. DentistAppointmentCalendar.com. Once effective; debated now. Author's view: not worth it — unbrandable, spammy-looking, too long to remember. **Pick a name good for your brand first and let SEO follow.**

## Trademark considerations

*(Not legal advice — consult a lawyer for specifics.)*

- **How it works.** Trademark law varies by country but aims to prevent customer confusion when two companies in the same market use similar names. You get some **"common law" rights automatically** just by using a name in your market — registration (e.g. USPTO in the US, ~6–12 months, lawyer recommended) makes enforcement far easier. Worth it once you have traction.
- **Descriptive names are hard to trademark.** You can't monopolize generic terms (couldn't trademark "Startup Jobs" for a startup job board). The upside: nobody else can trademark it either, so you're unlikely to infringe. Cuts both ways.
- **Check before committing.** Search existing trademarks: USPTO (https://www.uspto.gov/trademarks/search), EUIPO for the EU, WIPO Global Brand Database internationally. Don't stop there — common-law rights exist without registration, so Google who else uses the name and in what context. **Be especially careful near big brands** — they enforce aggressively, and disputes are expensive even if you think you're in a different market.
- **Can't use a trademark to grab a taken domain.** The **UDRP** dispute process exists to stop squatting on established brands, not to acquire domains you simply want. A key factor is whether the domain was registered **before or after** the trademark — register-before-trademark owners are very hard to dislodge. If ever in a dispute (either side), hire a lawyer who specializes specifically in **domain disputes/UDRP**, not just any trademark lawyer.
