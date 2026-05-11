# Frontend Developer Roadmap Design Specification

## Overview
This document outlines the structural and geometric design of a technical roadmap interface, prioritized over specific color schemes. The design emphasizes clear hierarchy, modular progress tracking, and interactive flow.

## 1. Structural Hierarchy
The interface follows a vertical "tree-and-branch" structure:
- **Central Spine:** A vertical dashed line acts as the chronological anchor.
- **Milestone Nodes:** Large, rectangular blocks indicating major learning phases (e.g., "Internet", "HTML", "CSS").
- **Branching Modules:** Horizontal connections leading to secondary and tertiary topics related to the main milestone.
- **Information Panels:** Floating boxes on the left/right for supplemental context (e.g., "Personal Recommendation", "Related Roadmaps").

## 2. Geometric Placement & Spacing
- **Grid System:** A centered, symmetrical layout for the main path, with asymmetrical callouts for auxiliary information.
- **Spacing (Vertical):** Generous vertical gutters between major milestones to indicate distinct learning phases.
- **Node Geometry:**
    - **Primary Nodes:** Rectangular with a slight border radius (e.g., 4px-8px).
    - **Connector Lines:** Solid horizontal lines for direct dependencies; dashed vertical lines for the primary progress path.
- **Container Blocks:** Large sections (e.g., "AI in Development", "Advanced Frontend") are bounded by horizontal rules to segment the learning journey.

## 3. Component Patterns
- **Roadmap Nodes:** Container units with a label and a "check" or "info" icon placeholder.
- **Status Indicators:** Small circular or pill-shaped markers for item status (e.g., "New", "Personal Recommendation").
- **Navigation Header:** Sticky top bar with breadcrumbs and primary action buttons (Download, Weekly Newsletter).
- **FAQ Accordions:** A stacked list of collapsible panels at the bottom for supplemental text content.

## 4. Visual Priority
1.  **Structure:** Vertical flow and horizontal branching.
2.  **Navigation:** Clear breadcrumbs and search.
3.  **Hierarchy:** Distinction between "Main Path" nodes and "Related" sidebars.
4.  **Geometry:** Consistent box sizing and connector alignment.
