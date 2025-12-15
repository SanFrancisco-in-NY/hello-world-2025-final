# Toilet Delivery – Restroom Wayfinding for Delivery Workers

> A web prototype that helps NYC delivery workers find predictable, dignified access to clean restrooms—fast.

## Overview

Toilet Delivery is a map-based web app built for delivery and gig workers who spend their shifts on the road with limited access to restrooms. We use NYC open data and a simple, Apple-inspired interface to surface nearby, usable restrooms and make them easy to get to and understand at a glance.

We exist to give delivery workers predictable, dignified access to clean restrooms—fast. Our product makes the nearest usable option easy to find and easy to enter, aligning venues, platforms, and city partners so drivers don’t have to negotiate or guess. The promise is simple: confidence in a quick, respectful bio break without disrupting the route.

Calm, clear, and human. We value dignity, predictability, and safety; we design for neutrality and low-friction use at street speed. Every touchpoint favors legibility over decoration, uses plain language, and defaults to accessibility (large tap targets, high contrast, inclusive icons). We aim to be a good citizen in the city: respectful of venues, mindful of neighbors, and focused on solutions that work in the real world—today and at scale.

---

## Live Demo & Design

- **Live prototype:** https://hello-world-2025-final.vercel.app/  
- **GitHub repo:** https://github.com/SanFrancisco-in-NY/hello-world-2025-final  
- **Design system & UI (Figma):**  https://www.figma.com/design/jaziAifDqdu2MlJoIAUMIA/Delivery-Toilet

The Figma file includes: brand & visual guidelines, logo and icon set, UI components, interaction flows, animations, poster, and business cards.

---

## Core Features (MVP)

- **Map-based browsing**  
  - Mapbox web map centered on NYC with custom pins for restrooms.
  - Apple-style UI: clean card layout, subtle motion, and semantic colors.

- **“Around me” restroom discovery**  
  - Shows nearby options based on the user’s current area.  
  - Highlights closest options first, with clear distance / ETA indicators.

- **Restroom detail cards**  
  - Name / venue type  
  - Basic access info (public, staff-gated, etc.)  
  - Hours and simple amenity tags (e.g., accessibility).

- **Ratings (prototype level)**  
  - Early interface for reporting whether a restroom was usable and how clean it felt.  
  - Intended to feed into reliability and cleanliness scores over time.

> Note: This is a **studio prototype**, not a production service. Data quality, availability, and coverage are limited and primarily for demonstration and discussion.

---

## Data Source

We rely on the **NYC Open Data “Public Restrooms” dataset** as a starting point:

- NYC Open Data – Public Restrooms  
  https://data.cityofnewyork.us/City-Government/Public-Restrooms/i7jb-7jku/about_data

In future iterations, this open dataset would be augmented with:

- Partner venues that explicitly welcome delivery workers.  
- Crowdsourced verification and rating data from drivers.

---

## Tech Stack

- **Frontend:** JavaScript + Vite (SPA)  
- **Map & routing:** Mapbox  
- **Styling:** Custom CSS based on our Figma design system (Apple-inspired, 8-pt spacing, semantic colors)  
- **Deployment:** Vercel

---

## Studio Context

This project was created as part of the Hello World studio at SVA MFA Interaction Design (Fall 2025). It sits alongside:

- A design research project on restroom access and working conditions for NYC delivery workers.
- A brand and visual identity system for Toilet Delivery (TD).

If you’re viewing this from outside the studio context and want to know more about the research, please see the case-study section in our Figma file or contact the team:
newyorksanfrancisco201@gmail.com

---

## Team

Toilet Delivery is designed and built by:

Seren Kim & Feifey Wang

Studio: Hello World, SVA MFA Interaction Design.

---

## License

This project is currently for educational and demonstration purposes.