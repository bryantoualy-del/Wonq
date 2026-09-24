# RPG Connect v1 — Wonq / Cockpit

Protocol implemented in Wonq on 2026-09-24.

## Goal

Keep the Wonq companion fully usable offline while allowing a GM Cockpit/Encounter app to discover it, receive structured actions, rebuild its current state, and request a resynchronization.

The Cockpit is the GM authority for encounter orchestration. Wonq remains the source of truth for Wonq's local character state until a later bidirectional state-apply contract is explicitly added.

## Transport

Two transports may run at the same time. Consumers MUST deduplicate by event `id`.

1. Same-browser local test: `BroadcastChannel("rpg-connect:" + SESSION_CODE)`.
2. Cross-device: configurable WebSocket endpoint. If Wonq is served over HTTPS, use `wss://`.

No relay server is bundled in the Wonq repository.

## Envelope

Every message uses:

```json
{
  "protocol": "rpg-connect",
  "version": "1.0",
  "id": "uuid-or-event-id",
  "timestamp": "ISO-8601",
  "session": { "code": "A7K9" },
  "actor": { "id": "wonq", "name": "Wonq", "kind": "pc" },
  "source": {
    "app": "wonq-companion",
    "appVersion": "2026.09.24",
    "system": "dnd5e"
  },
  "type": "state.snapshot",
  "payload": {}
}
```

Major protocol versions must match. A receiver should ignore messages for another non-empty session code.

## Wonq capabilities

Wonq advertises:

- `companion.hello`
- `state.snapshot`
- `state.patch`
- `action.resolved`
- `combat.started`
- `turn.ended`
- `rest.completed`
- `concentration.changed`
- `hp.changed`
- `resource.changed`
- `feature.used`
- handles `session.resync`, `state.request`, and `ping`

The Cockpit should answer `companion.hello` with `cockpit.hello`.

## State snapshot

`state.snapshot.payload.state` contains:

```json
{
  "characterId": "wonq",
  "hp": { "current": 59, "max": 59, "temp": 0 },
  "combat": { "id": 1, "turn": 1, "round": 1, "turnDamage": 0 },
  "economy": { "action": 0, "bonus": 0, "reaction": 0, "move": 0 },
  "resources": {
    "inspiration": 5,
    "dodge": 3,
    "memory": 5,
    "mistyFree": 1,
    "commandFree": 1,
    "slots": { "1": 4, "2": 3, "3": 3, "4": 2 }
  },
  "concentration": null,
  "tale": null,
  "taleChoices": null,
  "cortege": false,
  "conditions": [],
  "sessionSpell": "",
  "updatedAt": "ISO-8601"
}
```

## State patch

After an action that changes Wonq's state, Wonq emits `state.patch`.

```json
{
  "baseCharacterId": "wonq",
  "changes": [
    { "path": "resources.inspiration", "previous": 5, "value": 4 }
  ],
  "stateUpdatedAt": "ISO-8601"
}
```

The Cockpit can apply patches optimistically but a full snapshot always wins during resynchronization.

## Semantic action events

Every journaled action emits one semantic event, with the exact Wonq journal title/text plus the state delta. The event type is one of the advertised semantic types. Unknown/future actions fall back to `action.resolved`.

Targets are not yet authoritative in Wonq v1. If an action concerns another creature and no target ID is present, the Cockpit must show it as unassigned / GM-confirmable rather than guessing.

## Resynchronization

Cockpit -> Wonq:

```json
{
  "protocol": "rpg-connect",
  "version": "1.0",
  "id": "...",
  "timestamp": "...",
  "session": { "code": "A7K9" },
  "actor": { "id": "cockpit", "name": "Cockpit", "kind": "gm" },
  "source": { "app": "gm-cockpit", "appVersion": "..." },
  "type": "session.resync",
  "payload": {}
}
```

Wonq answers with `companion.hello` and then `state.snapshot`.

`state.request` has the same response behavior.

## Handshake

On connection/resync Wonq emits `companion.hello`, including character metadata and its capabilities.

The Cockpit should emit:

```json
{
  "protocol": "rpg-connect",
  "version": "1.0",
  "id": "...",
  "timestamp": "...",
  "session": { "code": "A7K9" },
  "actor": { "id": "cockpit", "name": "Cockpit", "kind": "gm" },
  "source": { "app": "gm-cockpit", "appVersion": "..." },
  "type": "cockpit.hello",
  "payload": { "role": "gm" }
}
```

## Cockpit implementation requirements

- Keep a session store independent of the UI.
- Key participants by permanent `actor.id`; never by display name.
- Deduplicate every incoming event by `id`.
- Keep the latest complete snapshot per character.
- Apply `state.patch` after the snapshot.
- A later `state.snapshot` replaces the derived state for that character.
- Provide a visible `Resynchroniser` button that broadcasts `session.resync`.
- On Cockpit page reload, restore its saved session, reopen transports, send `cockpit.hello`, then `session.resync`.
- Mark companions online/offline from handshakes / transport status; do not delete their last known state when disconnected.
- Do not auto-apply effects to an NPC/other PC when the event has no authoritative target ID.
- Keep the transport behind an adapter so BroadcastChannel and WebSocket use the exact same protocol messages.
