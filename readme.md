# Lavaredo webpage

A modern, responsive website showcasing cycling jersey designs. Inspired by maap.cc but focused only on displaying the designs without e-commerce functionality.

## Fonts Used

- **Montserrat**: Main font for body text and general UI
- **Jacquard 24**: Custom display font by Sarah Cadigan-Fried used for hero headings

## Font Installation

To properly display the site:

1. Download the Jacquard 24 font files from the designer (Sarah Cadigan-Fried)
2. Place the font files in the `/fonts` directory:
   - Jacquard24-Regular.woff2
   - Jacquard24-Regular.woff

## Project Structure

```
cycling-gallery/
│
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # CSS styles
├── js/
│   └── script.js       # JavaScript functionality
├──              # Image assets
│   ├── hero-bg.jpg
│   ├── about.jpg
│   ├── collection1.jpg
│   ├── collection2.jpg
│   ├── collection3.jpg
│   ├── jersey1.jpg
│   ├── jersey2.jpg
│   └── ...
└── data/
    └── jerseys.json    # JSON file containing jersey data
```

## Features

- Responsive design that works on all device sizes
- Filtering system to sort jerseys by category
- Modern, clean UI focused on showcasing the designs
- Smooth scrolling navigation
- Gallery layout with hover effects
- Product modal with size selection

## Setup Instructions

1. Clone or download this repository
2. Add your own jersey images to the `images` folder
3. Update the jersey data in `data/jerseys.json` to match your images
4. Open `index.html` in a web browser

## Customization

- Change colors by modifying the CSS variables
- Update jersey data in the JSON file
- Replace images with your own designs

## Technologies Used

- HTML5
- CSS3 (Flexbox & Grid for layouts)
- Vanilla JavaScript
- Google Fonts (Montserrat)
