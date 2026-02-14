# Product Requirements Document

**Project:** Supply-Demand Matching Platform
**Type:** Hackathon Prototype
**Version:** 1.0
**Date:** February 2026

---

## 1. Functional Requirements

### 1.1 Authentication

| #     | Requirement                                                                                       |
| ----- | ------------------------------------------------------------------------------------------------- |
| FR-01 | Organisations can register with: name, email, contact number, address, description, and password. |
| FR-02 | Organisations can log in using email and password.                                                |
| FR-03 | Sessions must be maintained securely until the user explicitly logs out.                          |

---

### 1.2 Supply Management

Organisations can create, manage, and publish supply listings.

| #     | Requirement                                                                                                                                     |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-04 | Create a supply listing with: name, description, price, quantity, expiry date, category, supplier name, supplier contact, and supplier address. |
| FR-05 | Update any field of an existing supply listing.                                                                                                 |
| FR-06 | Delete a supply listing by name.                                                                                                                |
| FR-07 | Trigger an AI semantic search to find matching demands for a given supply listing.                                                              |

---

### 1.3 Demand Management

Organisations can create, manage, and publish demand listings.

| #     | Requirement                                                                                                      |
| ----- | ---------------------------------------------------------------------------------------------------------------- |
| FR-08 | Create a demand listing with: name, description, required price range, quantity, required-by date, and category. |
| FR-09 | Update any field of an existing demand listing.                                                                  |
| FR-10 | Delete a demand listing by name.                                                                                 |
| FR-11 | Trigger an AI semantic search to find matching supplies for a given demand listing.                              |

---

### 1.4 AI Semantic Matching

The platform uses an AI semantic algorithm to intelligently match supply and demand listings.

| #     | Requirement                                                                                                                                     |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-12 | On search trigger, the AI algorithm evaluates all relevant listings from the database and returns ranked match results with a confidence score. |
| FR-13 | Match results are cached per search query with a TTL of 1 hour. Subsequent identical searches are served from cache.                            |
| FR-14 | Cache is invalidated immediately when a relevant supply or demand listing is updated or deleted.                                                |
| FR-15 | Users can save or dismiss individual match results. Saved matches are retained; dismissed matches are hidden from results.                      |
| FR-16 | Each match result displays: listing name, description, category, price, quantity, expiry/required-by date, and match confidence score.          |

---

### 1.5 Request Management

After reviewing match results, organisations can send a connection request to initiate a business discussion.

| #     | Requirement                                                                                                                            |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------- |
| FR-17 | An organisation can send a request to another organisation based on a match result. The request includes the relevant listing details. |
| FR-18 | A request has one of the following statuses: `Pending`, `Accepted`, or `Rejected`.                                                     |
| FR-19 | The receiving organisation can accept or reject an incoming request.                                                                   |
| FR-20 | On acceptance, a Business Room is automatically created between the two organisations.                                                 |
| FR-21 | On rejection, the requesting organisation is notified and no Business Room is created.                                                 |

---

### 1.6 Business Room

A Business Room is a private channel created after a request is accepted, allowing two organisations to negotiate and finalise a deal.

| #     | Requirement                                                                                               |
| ----- | --------------------------------------------------------------------------------------------------------- |
| FR-22 | A Business Room is automatically created upon request acceptance and is linked to the originating match.  |
| FR-23 | Both organisations can exchange messages within the Business Room.                                        |
| FR-24 | A Business Room has one of the following statuses: `In Progress`, `Success`, or `Failed`.                 |
| FR-25 | Either organisation can mark the room as `Success` (deal finalised) or `Failed` (negotiation broke down). |
| FR-26 | On `Success`, the deal confirmation and barcode generation flow is triggered.                             |
| FR-27 | Business Rooms can be deleted by either party.                                                            |

---

### 1.7 Barcode Security

Once a deal is marked as successful, a unique barcode is generated to authenticate and secure the transaction.

| #     | Requirement                                                                                                         |
| ----- | ------------------------------------------------------------------------------------------------------------------- |
| FR-28 | On deal success, the system generates a unique QR code encoding: deal ID, timestamp, and both organisation IDs.     |
| FR-29 | The QR code is stored against the deal record and made available for download by both parties.                      |
| FR-30 | Any party can scan the QR code to verify the deal's authenticity by checking the encoded data against the database. |
| FR-31 | Each QR code is unique and cannot be reused or duplicated across deals.                                             |

---

## 2. Non-Functional Requirements

### 2.1 Performance

| #      | Requirement                                                                                  |
| ------ | -------------------------------------------------------------------------------------------- |
| NFR-01 | Search results (cache hit) must be returned within 500ms.                                    |
| NFR-02 | AI semantic search (cache miss) must return results within 5 seconds.                        |
| NFR-03 | All standard API responses (CRUD operations) must respond within 1 second under normal load. |

---

### 2.2 Scalability

| #      | Requirement                                                                                         |
| ------ | --------------------------------------------------------------------------------------------------- |
| NFR-04 | The system must support concurrent usage by multiple organisations without performance degradation. |
| NFR-05 | The caching layer must be able to handle high-frequency identical search queries efficiently.       |

---

### 2.3 Security

| #      | Requirement                                                                       |
| ------ | --------------------------------------------------------------------------------- |
| NFR-06 | All passwords must be hashed using a secure hashing algorithm (e.g., bcrypt).     |
| NFR-07 | All API endpoints must require authentication via a secure token (e.g., JWT).     |
| NFR-08 | Business Rooms are private and accessible only to the two organisations involved. |
| NFR-09 | Generated QR codes must be cryptographically unique and tamper-evident.           |

---

### 2.4 Reliability & Availability

| #      | Requirement                                                                                                        |
| ------ | ------------------------------------------------------------------------------------------------------------------ |
| NFR-10 | The platform should target 99% uptime during the hackathon demonstration window.                                   |
| NFR-11 | Cache failures must not break the core search flow; the system must gracefully fall back to a live database query. |

---

### 2.5 Usability

| #      | Requirement                                                                                            |
| ------ | ------------------------------------------------------------------------------------------------------ |
| NFR-12 | The UI must clearly display match confidence scores to help organisations make informed decisions.     |
| NFR-13 | Business Room status changes must be immediately reflected in the UI without requiring a page refresh. |
| NFR-14 | Error messages must be clear, specific, and actionable.                                                |

---

### 2.6 Maintainability

| #      | Requirement                                                                                                           |
| ------ | --------------------------------------------------------------------------------------------------------------------- |
| NFR-15 | All API endpoints must be RESTful and follow consistent naming conventions.                                           |
| NFR-16 | The AI matching module must be decoupled from the core application logic to allow independent updates or replacement. |

---

_Document prepared for hackathon prototype scope. Requirements marked for future consideration are out of scope for v1.0._
