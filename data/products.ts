// import type { Language } from "@/components/LanguageProvider";

// export type ProductCategory =
//   | "Kids & Play"
//   | "Home & Living"
//   | "Decor"
//   | "Gifts"
//   | "Desk & Office"
//   | "Accessories"
//   | "Collectibles"
//   | "Personalized";

// export type LocalizedText = Record<Language, string>;

// export type ProductVariant = {
//   color: LocalizedText;
//   images: string[];
// };

// export type Product = {
//   id: string;
//   name: LocalizedText;
//   slug: string;
//   description: LocalizedText;
//   price: number;
//   category: ProductCategory;
//   variants: ProductVariant[];
//   emoji: string;
//   featured?: boolean;
// };

// export const products: Product[] = [
//   {
//     id: "coffee-001",

//     name: {
//       en: "Sweet Coffee ☕",
//       de: "Süßer Kaffee ☕",
//       ar: "قهوة لطيفة ☕",
//     },

//     slug: "sweet-coffee",

//     description: {
//       en: "A cute 3D-printed coffee piece designed for imaginative play and creative little kitchens.",
//       de: "Ein süßes 3D-gedrucktes Kaffeestück für fantasievolles Spielen und kreative Kinderküchen.",
//       ar: "قطعة قهوة لطيفة مطبوعة بتقنية ثلاثية الأبعاد، مصممة للعب الخيالي والمطابخ الصغيرة الإبداعية.",
//     },

//     price: 6.9,
//     category: "Kids & Play",

//     variants: [
//       {
//         color: {
//           en: "Brown",
//           de: "Braun",
//           ar: "بني",
//         },

//         images: [
//           "/images/products/coffee-1.jpg",
//           "/images/products/coffee-2.jpg",
//           "/images/products/coffee-3.jpg",
//         ],
//       },
//     ],

//     emoji: "☕",
//     featured: true,
//   },

//   {
//     id: "ice-cream-001",

//     name: {
//       en: "Sweetie Ice Cream 🍦",
//       de: "Süßes Eis 🍦",
//       ar: "آيس كريم لطيف 🍦",
//     },

//     slug: "sweetie-ice-cream",

//     description: {
//       en: "A playful 3D-printed ice cream creation made for imaginative play.",
//       de: "Eine verspielte 3D-gedruckte Eiskreation für fantasievolles Spielen.",
//       ar: "إبداع آيس كريم مرح مطبوع بتقنية ثلاثية الأبعاد ومصمم للعب الخيالي.",
//     },

//     price: 6.9,
//     category: "Kids & Play",

//     variants: [
//       {
//         color: {
//           en: "Pistachio",
//           de: "Pistazie",
//           ar: "فستق",
//         },

//         images: [
//           "/images/products/ice-cream-pistachio-1.jpg",
//           "/images/products/ice-cream-pistachio-2.jpg",
//         ],
//       },

//       {
//         color: {
//           en: "Chocolate",
//           de: "Schokolade",
//           ar: "شوكولاتة",
//         },

//         images: [
//           "/images/products/ice-cream-chocolate-1.jpg",
//           "/images/products/ice-cream-chocolate-2.jpg",
//         ],
//       },

//       {
//         color: {
//           en: "Vanilla",
//           de: "Vanille",
//           ar: "فانيليا",
//         },

//         images: [
//           "/images/products/ice-cream-vanilla-1.jpg",
//         ],
//       },
//     ],

//     emoji: "🍦",
//     featured: true,
//   },

//   {
//     id: "carrot-001",

//     name: {
//       en: "Happy Carrot 🥕",
//       de: "Fröhliche Karotte 🥕",
//       ar: "جزرة مرحة 🥕",
//     },

//     slug: "happy-carrot",

//     description: {
//       en: "A colorful 3D-printed carrot designed for playful little kitchens and creative play.",
//       de: "Eine farbenfrohe 3D-gedruckte Karotte für verspielte Kinderküchen und kreatives Spielen.",
//       ar: "جزرة ملونة مطبوعة بتقنية ثلاثية الأبعاد، مصممة للمطابخ الصغيرة المرحة واللعب الإبداعي.",
//     },

//     price: 6.5,
//     category: "Kids & Play",

//     variants: [
//       {
//         color: {
//           en: "Orange",
//           de: "Orange",
//           ar: "برتقالي",
//         },

//         images: [
//           "/images/products/carrot-1.jpg",
//           "/images/products/carrot-2.jpg",
//           "/images/products/carrot-3.jpg",
//         ],
//       },
//     ],

//     emoji: "🥕",
//     featured: true,
//   },

//   {
//     id: "corn-001",

//     name: {
//       en: "Sunny Corn 🌽",
//       de: "Sonniger Mais 🌽",
//       ar: "ذرة مرحة 🌽",
//     },

//     slug: "sunny-corn",

//     description: {
//       en: "A cheerful 3D-printed corn piece perfect for pretend-play kitchens.",
//       de: "Ein fröhliches 3D-gedrucktes Maisstück, perfekt für Kinderküchen und Rollenspiele.",
//       ar: "قطعة ذرة مرحة مطبوعة بتقنية ثلاثية الأبعاد، مثالية للمطابخ التخيّلية ولعب الأدوار.",
//     },

//     price: 4.9,
//     category: "Kids & Play",

//     variants: [
//       {
//         color: {
//           en: "Yellow",
//           de: "Gelb",
//           ar: "أصفر",
//         },

//         images: [
//           "/images/products/corn-1.jpg",
//           "/images/products/corn-2.jpg",
//           "/images/products/corn-3.jpg",
//         ],
//       },
//     ],

//     emoji: "🌽",
//     featured: true,
//   },

//   {
//     id: "egg-001",

//     name: {
//       en: "Little Egg 🥚",
//       de: "Kleines Ei 🥚",
//       ar: "بيضة صغيرة 🥚",
//     },

//     slug: "little-egg",

//     description: {
//       en: "A simple and charming 3D-printed egg made for imaginative play.",
//       de: "Ein schlichtes und charmantes 3D-gedrucktes Ei für fantasievolles Spielen.",
//       ar: "بيضة بسيطة ولطيفة مطبوعة بتقنية ثلاثية الأبعاد ومصممة للعب الخيالي.",
//     },

//     price: 3.9,
//     category: "Kids & Play",

//     variants: [
//       {
//         color: {
//           en: "White",
//           de: "Weiß",
//           ar: "أبيض",
//         },

//         images: [
//           "/images/products/egg-1.jpg",
//           "/images/products/egg-2.jpg",
//         ],
//       },
//     ],

//     emoji: "🥚",
//     featured: true,
//   },

//   {
//     id: "pasta-001",

//     name: {
//       en: "Mini Pasta 🍝",
//       de: "Mini-Nudeln 🍝",
//       ar: "مكرونة صغيرة 🍝",
//     },

//     slug: "mini-pasta",

//     description: {
//       en: "A playful 3D-printed pasta creation for creative pretend-play kitchens.",
//       de: "Eine verspielte 3D-gedruckte Nudelkreation für kreative Kinderküchen und Rollenspiele.",
//       ar: "إبداع مكرونة مرح مطبوع بتقنية ثلاثية الأبعاد للمطابخ التخيّلية واللعب الإبداعي.",
//     },

//     price: 7.9,
//     category: "Kids & Play",

//     variants: [
//       {
//         color: {
//           en: "Yellow",
//           de: "Gelb",
//           ar: "أصفر",
//         },

//         images: [
//           "/images/products/pasta-1.jpg",
//           "/images/products/pasta-2.jpg",
//           "/images/products/pasta-3.jpg",
//         ],
//       },
//     ],

//     emoji: "🍝",
//     featured: true,
//   },

//   {
//     id: "tomato-001",

//     name: {
//       en: "Happy Tomato 🍅",
//       de: "Fröhliche Tomate 🍅",
//       ar: "طماطم مرحة 🍅",
//     },

//     slug: "happy-tomato",

//     description: {
//       en: "A cute 3D-printed tomato designed to bring a playful touch to pretend kitchens.",
//       de: "Eine süße 3D-gedruckte Tomate, die Kinderküchen einen verspielten Touch verleiht.",
//       ar: "طماطم لطيفة مطبوعة بتقنية ثلاثية الأبعاد لإضافة لمسة مرحة إلى المطابخ التخيّلية.",
//     },

//     price: 4.9,
//     category: "Kids & Play",

//     variants: [
//       {
//         color: {
//           en: "Red",
//           de: "Rot",
//           ar: "أحمر",
//         },

//         images: [
//           "/images/products/tomato-1.jpg",
//           "/images/products/tomato-2.jpg",
//           "/images/products/tomato-3.jpg",
//         ],
//       },
//     ],

//     emoji: "🍅",
//     featured: true,
//   },

//   {
//     id: "pizza-001",

//     name: {
//       en: "Little Slice Pizza 🍕",
//       de: "Kleines Pizzastück 🍕",
//       ar: "قطعة بيتزا صغيرة 🍕",
//     },

//     slug: "little-slice-pizza",

//     description: {
//       en: "A cute 3D-printed pizza piece made for imaginative play.",
//       de: "Ein süßes 3D-gedrucktes Pizzastück für fantasievolles Spielen.",
//       ar: "قطعة بيتزا لطيفة مطبوعة بتقنية ثلاثية الأبعاد ومصممة للعب الخيالي.",
//     },

//     price: 8.9,
//     category: "Kids & Play",

//     variants: [
//       {
//         color: {
//           en: "Multi-Colors",
//           de: "Mehrfarbig",
//           ar: "متعدد الألوان",
//         },

//         images: [
//           "/images/products/pizza-1.jpg",
//         ],
//       },
//     ],

//     emoji: "🍕",
//     featured: true,
//   },
// ];