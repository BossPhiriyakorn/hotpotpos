import type { Item, Soup, SpiceLevel, DiningLocationOption, CookingStyleOption } from './types';
import { DiningLocation, CookingStyle } from './types';

export const PRICE_PER_100G = 29; // Price in currency units
export const VAT_RATE = 0.07; // 7%
export const TOTAL_TABLES = 24;

export const DINING_LOCATIONS: DiningLocationOption[] = [
  { id: DiningLocation.DineIn, name: 'ทานที่ร้าน' },
  { id: DiningLocation.Takeaway, name: 'กลับบ้าน' },
];

export const COOKING_STYLES: CookingStyleOption[] = [
  { id: CookingStyle.ReadyToEat, name: 'พร้อมทาน' },
  { id: CookingStyle.SeparateSoup, name: 'แยกน้ำซุป' },
  { id: CookingStyle.Uncooked, name: 'ยังไม่ต้ม' },
];

export const SPICE_LEVELS: SpiceLevel[] = [
  { id: 'none', name: 'ไม่เผ็ด', price: 0 },
  { id: 'less', name: 'เผ็ดน้อย', price: 0 },
  { id: 'medium', name: 'เผ็ดกลาง', price: 0 },
  { id: 'more', name: 'เผ็ดมาก', price: 0 },
  { id: 'very_more', name: 'เผ็ดมากๆ', price: 10 },
  { id: 'world', name: 'เผ็ดที่สุดในโลก', price: 80 },
];

// Updated SOUPS list to match the 11 items from the design
export const SOUPS: Soup[] = [
  { id: 'mala_original', name: 'ซุปหมาล่าดั้งเดิม', image: '/assets/soups/mala.png', isSpicy: true },
  { id: 'mala_thick', name: 'ซุปหมาล่าน้ำข้น', image: '/assets/soups/mala.png', isSpicy: true },
  { id: 'bone', name: 'ซุปกระดูก', image: '/assets/soups/original.png', isSpicy: false },
  { id: 'mala_dry', name: 'หมาล่าผัดแห้ง', image: '/assets/soups/mala.png', isSpicy: true },
  { id: 'mala_yum', name: 'ยำหมาล่า', image: '/assets/soups/mala.png', isSpicy: true },
  { id: 'tomyum_kung', name: 'ต้มยำมันกุ้ง', image: '/assets/soups/tomyum.png', isSpicy: true },
  { id: 'black_shabu', name: 'ชาบูน้ำดำ', image: '/assets/soups/black.png', isSpicy: false },
  { id: 'taojiew', name: 'ซุปเต้าเจี้ยว', image: '/assets/soups/original.png', isSpicy: false },
  { id: 'mala_milk', name: 'ซุปหมาล่านม', image: '/assets/soups/mala.png', isSpicy: true },
  { id: 'mala_namtok', name: 'ซุปหมาล่าน้ำตก', image: '/assets/soups/mala.png', isSpicy: true },
  { id: 'truffle', name: 'ซุปทรัฟเฟิล', image: '/assets/soups/black.png', isSpicy: false, isSpecial: true },
];

const shabuImageUrl = '/assets/addons/shabu_placeholder.png';

export const ADD_ONS: Item[] = [
  { id: 1, name: 'ฟองเต้าหู้ม้วน 1ชิ้น', price: 10, image: shabuImageUrl },
  { id: 2, name: 'ไส้เป็ด 1 แพค 80กรัม', price: 29, image: shabuImageUrl },
  { id: 3, name: 'เนื้อริบอายไสลด์ 1แพ็ค 50กรัม', price: 29, image: shabuImageUrl },
  { id: 4, name: 'ถ้วยน้ำจิ้ม 1ถ้วย', price: 9, image: shabuImageUrl, description: '(เฉพาะซื้อเพิ่มกลับบ้าน)' },
  { id: 5, name: 'น้ำจิ้มงาแบบซอง 90 กรัม', price: 19, image: shabuImageUrl, description: '(เฉพาะซื้อเพิ่มกลับบ้าน)' },
  { id: 6, name: 'น้ำจิ้มแซ่อู๋แบบซอง 90 กรัม', price: 19, image: shabuImageUrl, description: '(เฉพาะซื้อเพิ่มกลับบ้าน)' },
];