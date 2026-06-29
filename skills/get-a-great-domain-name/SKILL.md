---
name: get-a-great-domain-name
description: Find, evaluate, and acquire a great domain name on a budget. Use when naming a project, product, startup, or app; checking domain availability; brainstorming brandable or descriptive names; picking a TLD/extension; buying a domain that's already taken; researching a domain's owner; negotiating a domain purchase; valuing a domain; backordering an expiring domain; or transferring one. Triggers even without the word "domain" — e.g. "what should I call my new app", "is X taken", "someone owns the .com I want", "how much is this domain worth". Distills Marc Köhlbrugge's book "Get a Great Domain Name."
---

# Get a Great Domain Name

You are helping the user **find or acquire a great domain name without overpaying**. This skill turns the playbook from Marc Köhlbrugge's book into an operator's workflow: don't just give advice — actually do the research, run the lookups, evaluate names against the rules, and draft the outreach.

The core belief behind everything here: it only *seems* like all the good names are taken or unaffordable. Most owners of taken domains aren't using them and would happily take a fair offer. Most people see "taken" and give up — so a little research and one or two emails already puts the user ahead of ~95% of people.

## Operating principles

- **Be an operator, not a lecturer.** When you have tools, use them. Run `whois`, check availability across TLDs, look up comparable sales, check renewal fees, draft the actual email. Show results, not just methodology.
- **Think product name and domain name together.** Never let the user fall in love with a name before confirming the domain situation. The classic mistake is brainstorming names with no regard for availability, then discovering every reasonable domain is taken. (See `references/brainstorming.md`.)
- **Protect the user's negotiating position.** Don't inflate a seller's perception of value, don't signal deep pockets, and don't say things that give a seller a reason to hold firm or wait. (See `references/acquiring.md`.)
- **Treat a good domain as an asset, not an expense.** A premium domain holds or grows its value even if the project fails; a cheap forgettable one is a sunk cost. Frame spend accordingly. (See `references/valuation.md`.)
- **Always verify the boring stuff before committing:** renewal fee, transfer rules, trademark conflicts, and (for previously-used domains) history/blacklist status.

## Decide where the user is, then route

Figure out which situation applies and jump to the matching workflow below.

| Situation | Go to |
|---|---|
| Needs a name / brainstorming | **Workflow A** + `references/brainstorming.md` |
| Has a name, wants to check availability | **Workflow B** |
| The domain they want is taken | **Workflow C** + `references/acquiring.md` |
| Wants to know what a domain is worth | **Workflow D** + `references/valuation.md` |
| Negotiating / writing to an owner | `references/acquiring.md` (Negotiation + Email templates) |
| Picking a registrar / tool / marketplace | `references/tools-and-resources.md` |

---

## Workflow A — Brainstorm names that are actually available

1. **Clarify the brand.** Ask (or infer) what the product does, the audience, and the *feeling* it should project (playful/serious, scrappy/premium, technical/approachable). Decide with the user whether they lean **descriptive** (tells you what it does — great for SEO/bootstrapping) or **brandable** (a feeling/identity you build meaning into). Read `references/brainstorming.md` for the full techniques.
2. **Generate a deep keyword + concept list.** Go well beyond the obvious. For descriptive names, mine industry glossaries and jargon (the niche technical word is often the gem — e.g. `glass.photo`). For brandable names, use feelings, metaphors/analogies (Basecamp), and invented words (Spotify, Trello). Generate volume — a word buried in a list of 50 is often the one that clicks.
3. **Apply the Two-Part Rule as a filter.** A name should have at most **two memorable parts**. `.com` is the default and doesn't count as a part, so two real words + .com works (RoomAI.com, BetaList.com). On a non-.com, the **TLD eats one slot**, leaving one word (wip.co, startup.jobs). `getwip.co` breaks the rule. The test: *could someone hear it once and type it from memory?* A well-known phrase counts as one chunk (buildinpublic.com is fine).
4. **Check availability in bulk, not one at a time.** For each candidate word, check across many TLDs at once (Namecheap Bulk Search / Domainr / `references/tools-and-resources.md`). A word long gone as .com is often wide open on another TLD. Favor alliteration where word and TLD share a letter (handle.horse, followup.fish).
5. **Cross-pollinate from the market.** Browse marketplaces and expired-domain auctions for inspiration even if not buying — they surface patterns and variations you'd never invent (yay.cam → yay.camera).
6. **Shortlist with the checklist** (below), then for anything taken go to Workflow C.

When you have tool access, actually run the availability checks and bring back a ranked shortlist with availability + indicative price for each. Don't just hand the user a list of ideas to check themselves.

## Workflow B — Check availability the right way

A live website = taken. A redirect = taken (someone configured it). **A blank page does NOT mean available** — many domains are registered but unused. Confirm with a WHOIS check.

1. Run `whois <domain>` (the command is built into most systems) or use a registrar WHOIS page. If you can run shell commands, do it and report registrar, registration date, expiry date, and nameservers.
2. If unregistered → it's available; check the **renewal fee** before celebrating (see below), then register at a good registrar (`references/tools-and-resources.md`).
3. If registered → go to Workflow C.

**Always check the renewal fee before buying**, especially on non-.com or short/dictionary-word domains — some carry premium renewals of hundreds or thousands per year that aren't well-publicized. Quickest check: go to a registrar (e.g. Namecheap), use the *domain transfer* lookup, enter the domain; it shows the registry's current transfer/renewal price even though you can't actually transfer it yet.

## Workflow C — The domain I want is taken

There are exactly four moves. Read `references/acquiring.md` for the full playbook, negotiation tactics, and email templates.

1. **Find another name.** Always keep alternatives alive — it strengthens your hand and you can launch on a "good enough" domain now and upgrade later (WIP launched on wip.chat, later got wip.co).
2. **Wait for it to expire.** If the domain is unused, recently registered, or owned by a defunct party, and you're not in a rush, check the expiry date and place a free **backorder** (see `references/acquiring.md` and `references/tools-and-resources.md`). Crucial: **do NOT contact the owner if you're playing the expiry game** — an inquiry signals value and prompts them to renew. (This is how wip.co was won for $1,400 after a $22,000 quote.)
3. **Buy from a marketplace.** Check the domain in-browser and search Sedo / Afternic / Atom — the same domain is often listed cheaper somewhere than what a "make an offer" page would quote. Prefer Buy-Now if fair; otherwise Make-Offer (~50% of ask, never lowball) or Lease-to-Own.
4. **Negotiate with the owner.** If not listed, research the owner via historical WHOIS + Wayback Machine, assess their situation, then send a short, friendly, honest email. Let them name the price first when your range is wide; counter even when the price is fine (to avoid seller's remorse); always use Escrow.com with split fees.

## Workflow D — What's this domain worth?

There's no formula — every domain is one of a kind. Triangulate from **comparable sales** on NameBio: same extension + similar words (length/type matters most for very short domains), and same word + other extensions (popularity signal). Ignore automated appraisal tools (EstiBot, GoDaddy Appraisals) — they miss the context that actually drives price. Full method in `references/valuation.md`.

---

## Shortlist checklist (run before recommending any name)

- **Two-part rule:** ≤ 2 memorable parts; typeable from memory after hearing once.
- **Availability confirmed** via WHOIS (not just "blank page").
- **Renewal fee** checked and acceptable long-term.
- **TLD fit:** .com if possible; otherwise what established players in the niche use. Watch ccTLD SEO geo-targeting (.de → German audience). .co/.io/.ai are treated as generic by Google. Note .ai may feel dated long-term.
- **Trademark clear:** quick USPTO/EUIPO/WIPO + Google search; avoid anything near a big brand. (See `references/tools-and-resources.md`.)
- **History clean** (for previously-used domains): Wayback Machine + Google Safe Browsing / blacklist check; review backlink quality if SEO matters.
- **Spelling/pronunciation:** easy to say, spell, and hear; alliteration is a bonus.

## Reference files

- `references/brainstorming.md` — descriptive vs brandable techniques, the Two-Part Rule in depth, domain hacks, TLD categories and selection, bulk search.
- `references/acquiring.md` — the four options in detail, owner research, the full negotiation playbook, copy-paste email templates, backordering, escrow, and transfer mechanics.
- `references/valuation.md` — comparable-sales method, what drives price, the domain-as-asset mindset.
- `references/tools-and-resources.md` — registrars, WHOIS tools, backordering/expired-domain services, marketplaces, idea tools, plus SEO and trademark notes.
