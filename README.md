# Dr. Husain Aziz — Academic Portfolio Website

Associate Professor, Department of Civil Engineering, Kansas State University.

## Structure

```
site/
├── index.html          # Main page
├── base.css            # Reset & design tokens
├── style.css           # K-State themed styles
├── app.js              # CSV loading, interactions, dark mode
├── assets/
│   └── profile.jpg     # Profile photo
├── data/
│   ├── publications.csv
│   ├── citation_stats.csv
│   ├── grants.csv
│   ├── students.csv
│   ├── awards.csv
│   └── news.csv
└── README.md
```

## Features

- Data-driven via CSV files (editable without touching code)
- Light/dark mode toggle
- Smooth scroll navigation with active section highlighting
- Scroll-triggered fade-in animations
- Expandable publication abstracts and grant descriptions
- Mobile responsive with hamburger navigation
- Citation stats banner from Google Scholar data
- Show More/Show Less for publications list
- Accessible: semantic HTML, keyboard nav, proper ARIA labels
- SEO: meta tags, JSON-LD structured data, Open Graph

## Technology

Pure static HTML/CSS/JS — no build step required. Data loaded from CSV files at page load.

## Updating Data

Edit the CSV files in `data/` to update publications, grants, awards, students, or news. The page renders dynamically from these files on each load.

---

Created with [Perplexity Computer](https://www.perplexity.ai/computer)
