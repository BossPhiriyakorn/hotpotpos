import React, { createContext, useState, useContext, ReactNode } from 'react';

export type Language = 'th' | 'en' | 'cn';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  th: {
    // ProgressBar
    'step.weighing': 'ชั่งน้ำหนัก',
    'step.customize': 'เลือกเพิ่มเติม',
    'step.summary': 'ชำระเงิน',
    'step.success': 'สำเร็จ',
    'step.member': 'สะสมคะแนน',

    // Weighing Screen
    'weighing.title': 'นำสินค้าวางบนเครื่องชั่ง',
    'weighing.subtitle': 'ระบบจะคำนวณราคาให้อัตโนมัติ',
    'weighing.price_per_unit': 'ราคา 29 บาท/ขีด (100 กรัม)',
    'weighing.weight_label': 'น้ำหนัก (กรัม)',
    'weighing.price_label': 'ราคา (บาท)',
    'weighing.confirm': 'ยืนยันน้ำหนักและดำเนินการต่อ',
    'weighing.place_item': 'กรุณาวางสินค้าบนเครื่องชั่ง',
    'weighing.not_ready': 'ระบบยังไม่พร้อมใช้งาน',
    'weighing.skip_demo': 'ข้าม (Demo 500g)',

    // Buttons
    'btn.back': 'ย้อนกลับ',
    'btn.next': 'ถัดไป',
    'btn.summary': 'สรุปรายการ',
    'btn.pay': 'ชำระเงินแล้ว',
    'btn.finish': 'เสร็จสิ้น',

    // Customization
    'cust.header_soup': 'เลือกซุป',
    'cust.header_spice': 'เลือกระดับความเผ็ด',
    'cust.header_addon': 'เลือกของเพิ่มเติม',
    'cust.header_cooking': 'เลือกรูปแบบการปรุง',
    'cust.header_note': 'หมายเหตุเพิ่มเติม',
    'cust.total_price': 'ราคารวม (ยังไม่รวม VAT)',

    // Summary
    'sum.title': 'สรุปรายการสั่งซื้อ',
    'sum.weight_item': 'หมาล่าชั่งน้ำหนัก',
    'sum.spice_level': 'ระดับความเผ็ด',
    'sum.soup': 'น้ำซุป',
    'sum.cooking_style': 'รูปแบบการปรุง',
    'sum.note': 'หมายเหตุ',
    'sum.subtotal': 'ราคารวม',
    'sum.vat': 'ภาษีมูลค่าเพิ่ม 7%',
    'sum.grand_total': 'ยอดชำระทั้งหมด',
    'sum.paying': 'กำลังตรวจสอบการชำระเงิน...',
    'sum.wait': 'กรุณารอสักครู่',
    'sum.mobile_banking': 'รองรับการชำระเงินผ่าน Mobile Banking ทุกธนาคาร',

    // Language Selection
    'lang.select': 'กรุณาเลือกภาษา',
  },
  en: {
    // ProgressBar
    'step.weighing': 'Weighing',
    'step.customize': 'Customize',
    'step.summary': 'Payment',
    'step.success': 'Success',
    'step.member': 'Points',

    // Weighing Screen
    'weighing.title': 'Place items on the scale',
    'weighing.subtitle': 'The system will calculate the price automatically',
    'weighing.price_per_unit': 'Price 29 THB / 100g',
    'weighing.weight_label': 'Weight (g)',
    'weighing.price_label': 'Price (THB)',
    'weighing.confirm': 'Confirm & Continue',
    'weighing.place_item': 'Please place items on scale',
    'weighing.not_ready': 'System not ready',
    'weighing.skip_demo': 'Skip (Demo 500g)',

    // Buttons
    'btn.back': 'Back',
    'btn.next': 'Next',
    'btn.summary': 'Order Summary',
    'btn.pay': 'Payment Completed',
    'btn.finish': 'Finish',

    // Customization
    'cust.header_soup': 'Select Soup',
    'cust.header_spice': 'Select Spiciness',
    'cust.header_addon': 'Add-ons',
    'cust.header_cooking': 'Cooking Style',
    'cust.header_note': 'Additional Notes',
    'cust.total_price': 'Total (Excl. VAT)',

    // Summary
    'sum.title': 'Order Summary',
    'sum.weight_item': 'Mala by Weight',
    'sum.spice_level': 'Spiciness Level',
    'sum.soup': 'Soup Base',
    'sum.cooking_style': 'Cooking Style',
    'sum.note': 'Note',
    'sum.subtotal': 'Subtotal',
    'sum.vat': 'VAT 7%',
    'sum.grand_total': 'Grand Total',
    'sum.paying': 'Verifying payment...',
    'sum.wait': 'Please wait a moment',
    'sum.mobile_banking': 'Supports Mobile Banking from all banks',

    // Language Selection
    'lang.select': 'Please Select Language',
  },
  cn: {
    // ProgressBar
    'step.weighing': '称重',
    'step.customize': '定制',
    'step.summary': '支付',
    'step.success': '成功',
    'step.member': '积分',

    // Weighing Screen
    'weighing.title': '请将商品放在秤上',
    'weighing.subtitle': '系统将自动计算价格',
    'weighing.price_per_unit': '价格 29 泰铢 / 100克',
    'weighing.weight_label': '重量 (克)',
    'weighing.price_label': '价格 (泰铢)',
    'weighing.confirm': '确认重量并继续',
    'weighing.place_item': '请将商品放在秤上',
    'weighing.not_ready': '系统未准备好',
    'weighing.skip_demo': '跳过 (演示 500克)',

    // Buttons
    'btn.back': '返回',
    'btn.next': '下一步',
    'btn.summary': '订单汇总',
    'btn.pay': '支付完成',
    'btn.finish': '完成',

    // Customization
    'cust.header_soup': '选择汤底',
    'cust.header_spice': '选择辣度',
    'cust.header_addon': '加购配菜',
    'cust.header_cooking': '烹饪方式',
    'cust.header_note': '备注',
    'cust.total_price': '总价 (不含税)',

    // Summary
    'sum.title': '订单汇总',
    'sum.weight_item': '麻辣烫称重',
    'sum.spice_level': '辣度',
    'sum.soup': '汤底',
    'sum.cooking_style': '烹饪方式',
    'sum.note': '备注',
    'sum.subtotal': '小计',
    'sum.vat': '增值税 7%',
    'sum.grand_total': '总金额',
    'sum.paying': '正在验证支付...',
    'sum.wait': '请稍候',
    'sum.mobile_banking': '支持所有银行的手机银行支付',

    // Language Selection
    'lang.select': '请选择语言',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('th');

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
