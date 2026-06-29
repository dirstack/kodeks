# Acquiring a Registered Domain

The full playbook for when the domain you want already belongs to someone else. Pair with Workflow C in `SKILL.md`. Most registered domains are *unused* — the owner had plans that fizzled and pays renewals out of habit. You're offering money for something they're not using. Most people give up at "taken," so research + one or two emails already beats ~95% of people.

## Contents
- [The four options](#the-four-options)
- [Option 1: Find another name](#option-1-find-another-name)
- [Option 2: Wait for it to expire (+ backordering)](#option-2-wait-for-it-to-expire)
- [Option 3: Buy from a marketplace](#option-3-buy-from-a-marketplace)
- [Option 4: Reach out to the owner](#option-4-reach-out-to-the-owner)
- [Owner research](#owner-research)
- [Managing your identity & shaping perception](#managing-your-identity--shaping-perception)
- [Email templates](#email-templates)
- [Negotiation playbook](#negotiation-playbook)
- [Walking away (and coming back)](#walking-away-and-coming-back)
- [Payment via escrow](#payment-via-escrow)
- [Transferring the domain](#transferring-the-domain)
- [Considering a broker](#considering-a-broker)

## The four options

1. Find another name. 2. Wait for it to expire. 3. Buy from a marketplace. 4. Negotiate with the owner. Often you run several in parallel.

## Option 1: Find another name

Obvious but underrated. Keeping alternatives alive strengthens your negotiating position and lets you move fast. Launch on a "good enough" available domain now and **upgrade later** — WIP launched on wip.chat, then acquired wip.co once it had traction. You can pursue the better domain in the background while the project moves forward. Risk: the wanted domain may sell or rise in price — but in practice a project's growth tends to outrun the price increase, and if it costs more *because* you succeeded, you can probably afford it.

## Option 2: Wait for it to expire

Every domain has an expiry date; if the owner doesn't renew, it becomes available again — sometimes for a fraction of their asking price. This is how wip.co was won for **$1,400** after the broker quoted **$22,000**.

Best when: the expiry date isn't far off, you're not in a rush (or have a temp domain), and the domain looks unused.

**Will it actually expire?** Gauge the odds:
- **In use?** Unused domains lapse far more often.
- **How long registered?** Long-held domains tend to keep renewing; a domain registered ~a year ago and unused is a good candidate.
- **Owner still around?** Defunct companies / inactive individuals slip through the cracks.

**How expiry actually works:** the WHOIS expiry date is **not** the date it becomes available. After expiry the owner usually has a **60–90 day grace period** to renew. Be patient.

> **Critical rule:** if you're playing the expiry game, do **NOT** contact the owner. An inquiry signals the domain has value and may prompt them to renew. If expiry is close, patience beats outreach.

**Backordering** — instead of manually watching, place a backorder: a service auto-registers the domain the moment it's available post-expiry. More reliable than DIY (automation + sometimes exclusive registrar arrangements giving first access). If multiple people backordered it, it goes to **auction** among them — bidding typically starts ~$80, only the winner pays. It costs nothing upfront, so if there's a domain you'd love someday, just place a backorder.

**Choosing a backordering service:** services have exclusive partnerships with different registrars, so the right one depends on where the domain is currently registered. Check the WHOIS for the registrar, then pick a matching service. Because backorders are usually free, place them on **multiple** services to increase odds. (SnapNames, Park.io, Dynadot, Sav, GoDaddy Auctions — see `tools-and-resources.md`.)

## Option 3: Buy from a marketplace

Usually the most straightforward path. Visit the domain in-browser — a for-sale landing page often shows a price + buy button. If not, search Sedo, Afternic, Atom; some registrars (Namecheap) also list premiums in search.

- **The same domain is often listed on multiple marketplaces at different prices** (different commissions). Check more than one.
- Be wary of **"make an offer" / "contact seller"** pages with no price — sometimes it's a tactic to gauge your budget, sometimes the domain isn't truly listed (some registrars show a default brokerage page on everything). Before reaching out, check other marketplaces — you may find a fixed price lower than they'd quote. (Real case: linkscout.com showed "make an offer" directly, but Afternic listed Buy-Now $2,950 / min offer $1,917.)

**Ways to buy:**
- **Buy it now** — fixed price, instant. If it's fair, just buy it. Trying to haggle a reasonable Buy-Now price can backfire — sellers sometimes *raise* it.
- **Make an offer** — listed prices run high; a reasonable opener is ~**50% of ask**. Don't lowball — lowballs get ignored and the list price is usually rooted in some market reality.
- **Lease to own** — pay monthly over 12–36 months; domain held in escrow, transferred on final payment. You can opt out anytime but forfeit what you've paid. Good for hedging on an unproven project (e.g. building on a .cc while leasing the .com).
- **Renting** — pay indefinitely, never own; generally avoid — weak position when you later try to buy.

## Option 4: Reach out to the owner

If it's not listed, email the owner directly — often how the best domains are won below marketplace prices.

### Owner research

Do homework *before* the first email.

- **WHOIS.** Run `whois <domain>`. Most records now hide the owner behind privacy ("Redacted for Privacy").
- **Historical WHOIS.** Privacy defaults are recent — older records (via WhoisXML API) often expose the real name/email from before privacy. To judge if the old owner is still the owner, check whether **nameservers have stayed the same** for years (strong "same owner" signal). Even if it's changed, email the old contact and ask — worst case they say no.
- **Wayback Machine** (web.archive.org). If there's no live site now, there probably was one before. Archived pages reveal who owned it, what it was used for, business vs personal, and contact info. (For roomai.com, the Archive revealed a Thai company — which shaped the whole approach.)

**Assess the owner & value:**
- **Company or individual?** Individuals are easier. Large companies are hard (need the right person with authority, layers of approval). Small companies: target the CEO/founder, frame as easy money for a forgotten asset.
- **Likely financial situation?** A small company abroad weighs $2,000 very differently from a funded SV startup. Don't lowball — but a fair offer can be genuinely appealing to them.
- **Actively used?** Unused = much easier; you're helping them recoup renewal fees and then some.
- **Tech-savvy?** A savvy founder negotiates comfortably by email. A non-technical owner may see an unsolicited domain email as a scam — a phone call can build trust.

To gauge market value, check NameBio for comparable sales (see `valuation.md`).

### Managing your identity & shaping perception

- **Identity.** The author often uses a **pseudonym** — close enough to the real name to not raise flags at escrow, different enough that the seller can't Google him and discover he runs profitable businesses (which would inflate the ask). A generic name + plain Gmail reads as "just another person." If you have little online presence, using your real name is fine and can build rapport. Posing as a **middleman** ("I have a client interested…") creates a good-cop/bad-cop buffer — "let me check with my client" buys time and deflects on price; referencing a partner/budget-approver does the same.
- **Shape perception, don't reshape value.** Mind the gap between how *you* see the domain and how *they* see it — and don't accidentally raise its value in their eyes. The author wrote "Roomai.com" (not "RoomAI.com") to a Thai owner so it read as a plain word, not a hot AI keyword. If they think of it as a forgotten side project, don't mention the booming industry; if they don't know it's a desirable keyword, don't educate them. Reverse case: if an owner has an *inflated*, emotional attachment, gently frame the sale as finally getting value from an unrealized project — a happy ending, closing a chapter — rather than haggling. Be subtle; just make it easy to say yes.

### Email templates

**First email — short, friendly, honest.** Greet in their language if relevant; don't mention a price (yet); note it's unused (positions a win-win); no corporate-speak.

```
Subject: Your domain {domain}

Hi {name},

My name is {your first name}, I'm a {simple role, e.g. software developer} from
{place}. I noticed you own the {Domain.com} domain name, but it's currently not
being used.

Would you consider selling it? I'm working on a new project and that name would
be a good fit. Since you're not using it anymore, I was hoping I could buy it.

Let me know what you think.

Thanks!
{your first name}
```

**Follow-up (after ~10–14 days of silence).** One or two follow-ups is normal. Consider writing in the owner's language (via translation) and removing barriers ("I can have a {language}-speaking friend call you"). If still silent, you likely have the wrong address — try LinkedIn, X/Twitter, or phone. If follow-ups get no traction, **include a specific dollar amount** — real money on the table makes people respond.

```
Hi {name}, just following up on my note about {domain}. I'm still interested —
could you name a price you'd be happy with? (If English is awkward, I'm glad to
have a {language}-speaking friend call you.)
```

### Negotiation playbook

**Who names the price first?**
- **Let them go first when your range is wide** — if their number is low you save money; if high you learn where they stand. Avoids anchoring yourself too high (overpay) or too low (scare them off).
- **Name it first when:** they're not responding (a concrete offer shows you're serious); you want to move fast; or your budget is modest and the range is narrow (no point haggling $300 vs $500 — just name it).

**How to counter:**
- If **they** named a price within range → counter at **~60–70% of their ask** (roomai.com: countered $1,750 on $2,500 ≈ 70%). Room to meet in the middle without insulting.
- If **you** open → start at **~50% of your max budget**.
- **Never lowball** ($200 against a $2,500 ask kills the conversation). Stay in the same ballpark.

**Always counter, even when the price is fine.** Instantly accepting a first offer triggers **seller's remorse** ("if they said yes that fast, I went too low") → backtracking, excuses, foot-dragging on transfer. Countering lets them feel they negotiated well and both sides feel satisfied. (Exception: a clearly savvy businessperson who names a fair price and means it — you can accept outright; read the person.)

### Walking away (and coming back)

If the price is over budget or they won't sell: be kind, make no value judgment, move on. **How you walk away matters** — keep the door open without giving them a reason to hold firm.

- ✅ "Thanks for letting me know. That's outside my budget, so I'll explore some of my other options. Appreciate your time!" (signals you have alternatives — sometimes triggers a counter-offer.)
- ❌ "That's outside my budget *for now*." — "for now" tells them to wait; you'll be back with more money, so they have zero incentive to lower the price.

**Coming back later** is fine (budgets grow, projects matter more). Don't lead with a higher price — frame around *their* situation: "I noticed the domain still isn't in use — are you still open to selling?" If you must offer more, "I've been able to stretch my budget a bit" beats "my business is doing well and I can afford more." Avoid the spiral where you return every few months with a higher offer — the seller learns to just wait. If you sense that, walk away for real.

### Payment via escrow

Always use an escrow service (Escrow.com is the standard). Suggest it yourself, with **split fees** — it's fair and signals you're reasonable. Flow:
1. You initiate on Escrow.com (domain, agreed price, seller's email).
2. Both agree to terms on the platform.
3. You pay **Escrow.com** (not the seller directly).
4. Seller transfers the domain to your registrar account.
5. You confirm receipt.
6. Escrow.com releases payment to the seller.

This protects both sides; Escrow.com mediates disputes.

### Transferring the domain

- **Auth code** (EPP/auth code): the owner generates it at their registrar; you enter it at yours to start the transfer. Can take up to a week, but if the seller clicks the confirmation email the outgoing registrar sends, it completes much faster.
- **Registrar lock:** on by default to prevent unauthorized transfers — the owner must unlock first. Common sticking point for non-technical sellers; be ready to walk them through it.
- **60-day lock (ICANN):** no transfer within 60 days of initial registration or the most recent transfer. Ask about this early. You can often **opt out** at transfer time (useful if you'll move it again soon) — but only *before* the transfer completes.
- **TLD quirks:** some ccTLDs don't support standard transfers or need extra steps (e.g. paperwork). Check before closing.
- **Push (same registrar):** if the seller uses your registrar, an account-to-account "push" is usually instant — no auth code or waiting. Trade-off: less of a paper trail than a full transfer; fine with escrow but the seller may not get a clear confirmation.

## Considering a broker

- **Lightweight services (e.g. DomainAgents):** you name the domain, pay a small fee only if they locate the owner and present your offer, ~10% commission on success. They do basic research and relay messages (no negotiating for you, no seller contact details). Good for "nice to have" domains not worth your own time.
- **Professional brokers:** worth it for high-value (5–6 figure) domains — experience, relationships, and a signaling effect that you're serious. But for small/medium domains a broker signals you have money (exactly what you don't want a seller to think). For domains under ~$10k, negotiate directly using this playbook.
