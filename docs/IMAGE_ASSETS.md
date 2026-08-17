# White Angels Image Assets

Static fallback images live in:

`C:\Users\CyberFlacx\Desktop\WA\client\public\images\site\`

The owner can manually replace any placeholder by dropping a real image into that folder with the same filename. No code changes are required when the filename stays the same.

| Filename | Purpose | Suggested Orientation | Suggested Aspect Ratio | Where Displayed | Manual Replacement Path | Admin Media Slot |
| --- | --- | --- | --- | --- | --- | --- |
| `logo-white-angels.png` | Main White Angels logo | Square | `1:1` | Navbar, admin auth branding, general logo fallback | `C:\Users\CyberFlacx\Desktop\WA\client\public\images\site\logo-white-angels.png` | `LOGO` |
| `hero-home-bg.jpg` | Homepage background image | Landscape | `16:9` | Homepage split hero background | `C:\Users\CyberFlacx\Desktop\WA\client\public\images\site\hero-home-bg.jpg` | `HOME BACKGROUND` |
| `hero-home-model.jpg` | Homepage model image | Portrait | `4:5` | Homepage split hero right-side image | `C:\Users\CyberFlacx\Desktop\WA\client\public\images\site\hero-home-model.jpg` | `HOME MODEL` |
| `hero-shop.jpg` | Shop hero fallback | Landscape | `16:9` | Shop page hero, secondary product gallery fallback | `C:\Users\CyberFlacx\Desktop\WA\client\public\images\site\hero-shop.jpg` | `SHOP HERO` |
| `hero-about.jpg` | About hero fallback | Landscape | `16:9` | About page hero, product gallery fallback | `C:\Users\CyberFlacx\Desktop\WA\client\public\images\site\hero-about.jpg` | `ABOUT HERO` |
| `hero-contact.jpg` | Contact hero fallback | Landscape | `16:9` | Contact page hero | `C:\Users\CyberFlacx\Desktop\WA\client\public\images\site\hero-contact.jpg` | `CONTACT HERO` |
| `hero-cart.jpg` | Cart hero fallback | Landscape | `16:9` | Cart page hero | `C:\Users\CyberFlacx\Desktop\WA\client\public\images\site\hero-cart.jpg` | `CART HERO` |
| `hero-checkout.jpg` | Checkout hero fallback | Landscape | `16:9` | Checkout page hero, order success hero | `C:\Users\CyberFlacx\Desktop\WA\client\public\images\site\hero-checkout.jpg` | `CHECKOUT HERO` |
| `hero-track-order.jpg` | Track order hero fallback | Landscape | `16:9` | Track order page hero | `C:\Users\CyberFlacx\Desktop\WA\client\public\images\site\hero-track-order.jpg` | `TRACK ORDER HERO` |
| `hero-product.jpg` | Product hero fallback | Portrait or landscape | `4:5` preferred | Product page hero, product hero fallback | `C:\Users\CyberFlacx\Desktop\WA\client\public\images\site\hero-product.jpg` | `PRODUCT HERO` |
| `hero-admin-login.jpg` | Admin login background fallback | Landscape | `16:9` | Admin login and admin auth background assets | `C:\Users\CyberFlacx\Desktop\WA\client\public\images\site\hero-admin-login.jpg` | `ADMIN LOGIN BACKGROUND` |
| `banner-home-promo.jpg` | Homepage promotional banner | Wide landscape | `21:9` or `3:1` | Homepage promo banner section | `C:\Users\CyberFlacx\Desktop\WA\client\public\images\site\banner-home-promo.jpg` | `HOME PROMO BANNER` |
| `category-women.jpg` | Women category card placeholder | Portrait or square | `4:5` | Homepage category fallback card | `C:\Users\CyberFlacx\Desktop\WA\client\public\images\site\category-women.jpg` | Not admin-managed |
| `category-men.jpg` | Men category card placeholder | Portrait or square | `4:5` | Homepage category fallback card | `C:\Users\CyberFlacx\Desktop\WA\client\public\images\site\category-men.jpg` | Not admin-managed |
| `category-shoes.jpg` | Shoes category card placeholder | Portrait or square | `4:5` | Homepage category fallback card | `C:\Users\CyberFlacx\Desktop\WA\client\public\images\site\category-shoes.jpg` | Not admin-managed |
| `category-accessories.jpg` | Accessories category card placeholder | Portrait or square | `4:5` | Homepage category fallback card | `C:\Users\CyberFlacx\Desktop\WA\client\public\images\site\category-accessories.jpg` | Not admin-managed |
| `placeholder-product.jpg` | Generic product placeholder | Portrait | `4:5` | Product cards, cart, API fallback product image | `C:\Users\CyberFlacx\Desktop\WA\client\public\images\site\placeholder-product.jpg` | Not admin-managed |

## Manual Replacement Examples

- Home background: `C:\Users\CyberFlacx\Desktop\WA\client\public\images\site\hero-home-bg.jpg`
- Home right-side model image: `C:\Users\CyberFlacx\Desktop\WA\client\public\images\site\hero-home-model.jpg`
- Shop hero: `C:\Users\CyberFlacx\Desktop\WA\client\public\images\site\hero-shop.jpg`
- Logo: `C:\Users\CyberFlacx\Desktop\WA\client\public\images\site\logo-white-angels.png`

## Admin Media Override

The static files above are fallbacks only. When an admin uploads media through admin settings, the VPS-hosted upload URL overrides the static fallback automatically.
