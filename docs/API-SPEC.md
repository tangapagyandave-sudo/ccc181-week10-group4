# CampusConnect API Specification

Base URL: `http://localhost:3000/api/v1`

All responses are JSON. Login uses a token that expires in 1 hour.
Protected endpoints need this header: `Authorization: Bearer <token>`

## Endpoints

| Method | Path | Needs token | Request body | Success | Errors |
|---|---|---|---|---|---|
| GET | `/health` | No | none | 200 `{"status":"ok"}` | none |
| POST | `/sessions` | No | `{"email","password"}` | 200 `{"token","user":{"id","name","email"}}` | 400 `{"error":"Email and password are required."}`, 401 `{"error":"Invalid email or password."}` |
| GET | `/users/me` | Yes | none | 200 `{"id","name","email"}` | 401 `{"error":"Not logged in."}` |

## Other responses

| Case | Status | Body |
|---|---|---|
| Unknown route | 404 | `{"error":"Not found."}` |
| Server crash | 500 | `{"error":"Something went wrong."}` |

The same 401 message is used for an unknown email and a wrong password, so nobody can guess which emails exist. The password and its hash are never sent. Stack traces are never sent.

## Events (design only)

These endpoints are a plan. They are not built yet.

| Action | Method | Path | Needs token | Success | Errors |
|---|---|---|---|---|---|
| List all events | GET | `/events` | No | 200 list of events | none |
| Filter by month | GET | `/events?month=11` | No | 200 list of events in November | 400 if month is not 1 to 12 |
| Get one event | GET | `/events/:id` | No | 200 one event | 404 `{"error":"Not found."}` |
| Add an event | POST | `/events` | Yes | 201 the new event | 400 missing fields, 401 not logged in |
| Change an event | PATCH | `/events/:id` | Yes | 200 the updated event | 400, 401, 404 |
| Delete an event | DELETE | `/events/:id` | Yes | 204 no body | 401, 404 |

Example event: `{"id":1,"title":"Intramurals","date":"2026-11-20","place":"MSU-Naawan Gym"}`