# Lama Beads Website Direction

## Source Reference Review

The requested `awesome_design` folder was not present at `/Users/alexzhou/Downloads/awesome_design`. The available design library is at:

`/Users/alexzhou/Downloads/awesome-design-md-main/design-md`

No Tiffany-specific Markdown file exists in that library. I reviewed the available references and selected the closest fit for Lama Beads:

- Primary base: `apple/DESIGN.md`
- Secondary influence: `bugatti/DESIGN.md`
- Commerce behavior reference: `airbnb/DESIGN.md`
- Editorial typography reference: `elevenlabs/DESIGN.md` and `wired/DESIGN.md`
- Product-grid restraint reference: `nike/DESIGN.md`

## Design Position

The site should feel like a refined jewelry gallery, not a direct copy of Tiffany. The direction is:

- White or very pale aqua canvas.
- Quiet black/charcoal typography.
- One restrained aqua accent for primary actions and selected states.
- Product photography as the visual center.
- Generous whitespace and museum-like product spacing.
- No heavy decorative backgrounds, gradients, floating blobs, or busy card stacks.
- Minimal navigation and simple product discovery.

## Visual System

### Layout

- Header: minimal brand wordmark, product/category navigation, contact action.
- Home first viewport: Lama Beads brand signal, short value statement, one product-led hero image, CTA to collection.
- Collection section: product preview grid, each item with image, name, material/origin, and short description.
- Product detail: clicked item opens a dedicated detail view or modal with gallery, description, available videos, additional photos, care notes, and contact/buy action.
- Story/craft sections: only where they support trust and product value.

### Palette

- Canvas: pure white.
- Alternate surface: very pale aqua or very light warm gray.
- Ink: near-black charcoal.
- Muted text: soft gray.
- Accent: aqua, used sparingly for CTAs, focus, and selected states.
- Detail contrast: black-background product closeups can be used inside detail pages, not as the dominant whole-site color.

### Typography

- Display: elegant serif or high-quality editorial serif for larger headings.
- UI/body: clean sans-serif for navigation, product metadata, buttons, and descriptions.
- Keep type weights restrained. Avoid heavy bold display type.

### Product Cards

- Product cards should be photo-first and quiet.
- Preview image should be large enough to inspect the jewelry.
- Avoid tall marketing cards with too much copy.
- Card click target opens the product detail experience.

## Product Detail Model

Each jewelry item should support:

- `id`
- `name`
- `category`
- `previewImage`
- `galleryImages`
- `videos`
- `shortDescription`
- `fullDescription`
- `materials`
- `origin`
- `meaning`
- `care`
- `availability`
- `contactAction`

Videos should be real media files or hosted embeds when available. Until those exist, the site should omit the video section instead of showing fake video placeholders.

## Current Asset Notes

Saved asset folder:

`/Users/alexzhou/website_lama/assets/gamma-export/images`

Current asset split:

- `edited-images`: clean bead/product closeups on black backgrounds. Best for product details and close-up inspection.
- `original`: real phone product photos. Useful as secondary gallery material, but some include strong yellow backgrounds or phone UI artifacts.
- `generated-images`: Gamma-generated editorial images. Useful for story/craft sections, but should not replace real product photography.

Best next asset improvement:

- Shoot or prepare clean jewelry photos on white, pale aqua, or neutral stone backgrounds.
- Add short product videos for each item if the detail pages should include video.

## Implementation Notes

The first build should be a static catalog-style site with structured local product data. It can later become a full e-commerce store if payment, inventory, checkout, and order management are needed.

Recommended first implementation:

- React + Vite.
- Product data in a local module.
- Home collection grid.
- Product detail route or modal.
- Local assets served from the project.
- Contact-first purchasing CTA until real checkout requirements are defined.
