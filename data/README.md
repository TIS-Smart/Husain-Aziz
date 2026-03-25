# Website Data Files — How to Update

Each CSV file in this `data/` folder drives a section of the website.  
Edit the CSV, push to GitHub, and the website updates automatically — no HTML editing needed.

---

## File Reference

| CSV File | Website Section | What to Update |
|----------|----------------|----------------|
| `projects.csv` | Research Projects | Add projects with media (images, GIFs, YouTube) |
| `publications.csv` | Selected Publications | Add new papers, update citation counts |
| `citation_stats.csv` | Citation Stats Banner | Update total citations, h-index, i10-index |
| `grants.csv` | Grants & Funding | Add new grants, mark completed ones |
| `students.csv` | Teaching & Mentoring | Add new students, update graduation status |
| `awards.csv` | Honors & Awards | Add new awards/honors |
| `news.csv` | Recent Highlights | Add news items, invited talks, announcements |

---

## How to Edit

1. Open the CSV in Excel, Google Sheets, or any text editor
2. Add/modify rows following the existing column format
3. Save as CSV (UTF-8 encoding)
4. Commit and push to GitHub

**Important:** Keep the header row (first line) unchanged. The JavaScript reads column names from it.

---

## Column Definitions

### projects.csv
| Column | Description | Example |
|--------|-------------|---------|
| `id` | Unique project ID (used for placeholder SVG filenames) | cav-corridor |
| `category` | Research category: Emerging Tech, Data-Driven, Resilience | Emerging Tech |
| `title` | Project title | "Connected & Automated Vehicle Corridor" |
| `summary` | 1-2 sentence summary | "Developing Kansas's first CAV testing corridor..." |
| `image_url` | URL to a custom image (optional) | https://example.com/image.jpg |
| `gif_url` | URL to an animated GIF (optional) | https://example.com/demo.gif |
| `youtube_id` | YouTube video ID (optional — just the ID, not full URL) | g1vsh0y1W_I |
| `tags` | Pipe-separated tags | CAV\|KDOT\|Connected Infrastructure |
| `status` | Active or Complete | Active |

Media priority: `gif_url` > `image_url` > `assets/projects/{id}.svg` (auto-generated placeholder).  
For YouTube: the video thumbnail is shown with a play button. Clicking plays the video inline.  
To add a new project: add a row, optionally create a matching SVG in `assets/projects/`.

### publications.csv
| Column | Description | Example |
|--------|-------------|---------|
| `title` | Paper title | "Exploring the determinants of..." |
| `authors` | Author list | "Aziz, H.M.A., Ukkusuri, S.V." |
| `journal` | Journal/venue name | "Transportation Research Part C" |
| `year` | Publication year | 2025 |
| `citations` | Citation count (or "New") | 305 |
| `doi` | DOI identifier (without https://doi.org/) | 10.1016/j.trc.2020.102830 |
| `type` | journal, conference, book_chapter, report | journal |

The website shows the top 12 journal/book_chapter publications sorted by citation count.  
To show more or fewer, change `showCount` in `app.js` (search for "showCount").

### citation_stats.csv
| Column | Description |
|--------|-------------|
| `metric` | One of: citations, h_index, i10_index |
| `value` | The number |

### grants.csv
| Column | Description |
|--------|-------------|
| `title` | Grant/project title |
| `sponsor` | Funding agency (NSF, FMCSA, KDOT, etc.) |
| `amount` | Total award (include $ and commas) |
| `role` | Your role: PI, Co-PI, Lead-PI at K-State |
| `start_date` | MM/YYYY |
| `end_date` | MM/YYYY |
| `status` | Active, Complete, or Complete (ORNL) |
| `co_pis` | Co-PI names (optional) |

Only grants with `status = Active` appear on the website.

### students.csv
| Column | Description |
|--------|-------------|
| `name` | Student full name |
| `degree` | Ph.D., MS |
| `role` | Chair, Member, External Chair |
| `status` | Current, Graduated, Deceased |
| `start_term` | Starting term (optional) |
| `graduation` | Graduation term (e.g., "Summer 2024", "Spring 2027") |
| `institution` | University |
| `notes` | Additional notes (optional) |

The website shows students where `role = Chair` and `status = Current or Graduated`.

### awards.csv
| Column | Description |
|--------|-------------|
| `title` | Award name |
| `year` | Year or period (e.g., "2025-26", "FY 2017") |
| `organization` | Granting organization |

### news.csv
| Column | Description |
|--------|-------------|
| `date` | Date label (e.g., "2025-07", "2024-04") |
| `headline` | Short headline |
| `description` | One-sentence description |
| `link` | URL for "Read more" (optional — leave empty if none) |

The website shows the top 4 most recent items.

---

## Tips

- **Quoting:** Wrap any field containing commas in double quotes: `"Title with, comma"`
- **Special characters:** Use `&` directly — JavaScript handles escaping
- **Empty fields:** Leave blank between commas: `field1,,field3`
- **Adding rows:** Just add a new row at the bottom of the relevant CSV
- **Removing items:** Delete the entire row
- **Citation updates:** Periodically update the `citations` column in `publications.csv` and the values in `citation_stats.csv` from Google Scholar
