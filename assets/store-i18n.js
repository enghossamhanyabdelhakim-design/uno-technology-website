/* Uno store UI - strings. Arabic first, EN pair for every key. */
(function (w) {
  const S = {
    ar: {
      home:'الرئيسية', store:'المتجر', all:'كل المنتجات', results:'{n} منتج', no_results:'لا توجد منتجات مطابقة. جرّب تقليل الفلاتر.',
      clear_all:'مسح الكل', filters:'الفلاتر', apply:'عرض النتائج', category:'القسم', brand:'الماركة', price:'السعر', price_min:'من', price_max:'إلى',
      in_stock_only:'المتوفر فقط', sort:'الترتيب', view_grid:'عرض شبكي', view_list:'عرض قائمة', page:'صفحة', prev:'السابق', next:'التالي',
      sort_relevance:'الأنسب', sort_newest:'الأحدث', sort_price_asc:'السعر: من الأقل', sort_price_desc:'السعر: من الأعلى', sort_name_asc:'الاسم: أ إلى ي',
      sort_name_desc:'الاسم: ي إلى أ', sort_rating:'الأعلى تقييمًا', sort_discount:'الأكبر خصمًا', sort_stock:'المتوفر أولًا', sort_reviews:'الأكثر تقييمات',
      add_to_cart:'أضف إلى السلة', choose_options:'اختر الخيارات', out_of_stock:'نفد المخزون', in_stock:'متوفر', currency:'ج.م', off:'خصم {p}٪',
      search_ph:'ابحث عن منتج…', loading:'جارٍ التحميل…', error:'تعذّر التحميل. حاول مرة أخرى.', retry:'إعادة المحاولة', demo:'بيانات تجريبية للعرض فقط', demo_short:'تجريبي',
      reviews_n:'{n} تقييم', no_reviews:'لا توجد تقييمات بعد. التقييم متاح فقط للعملاء الذين اشتروا المنتج.', reviews:'التقييمات', verified:'مشتري موثّق',
      select_x:'اختر {x}', variant_oos:'غير متوفر', only_left:'متبقي {n} فقط', stock_ok:'متوفر في المخزون', stock_n:'المتوفر: {n}', sku:'رمز المنتج',
      qty:'الكمية', buy_now:'اشترِ الآن', delivery:'التوصيل', choose_gov:'اختر المحافظة', deliver_to:'التوصيل إلى {g}', within_days:'خلال {a} إلى {b} أيام عمل',
      arrives_between:'يصل بين {a} و{b}', ship_cost:'تكلفة الشحن: {p}', free_ship:'شحن مجاني', cod_yes:'الدفع عند الاستلام متاح', cod_no:'الدفع عند الاستلام غير متاح لهذه المحافظة',
      ship_unavailable:'التوصيل غير متاح لهذه المحافظة حاليًا', fbt:'يُشترى معه عادةً', fbt_total:'الإجمالي', add_all:'أضف الكل إلى السلة', this_item:'هذا المنتج',
      tab_desc:'الوصف', tab_specs:'المواصفات', tab_ship:'الشحن', tab_returns:'الاسترجاع', tab_warranty:'الضمان', tab_reviews:'التقييمات',
      not_set:'لم تُحدَّد هذه المعلومات بعد. تواصل معنا للتفاصيل.', zoom_hint:'مرّر للتكبير، اضغط للتكبير الكامل', close:'إغلاق', img_n:'صورة {n}',
      cart:'السلة', cart_empty:'سلتك فارغة', continue_shop:'متابعة التسوق', remove:'حذف', subtotal:'المجموع الفرعي', shipping:'الشحن', discount:'الخصم', total:'الإجمالي',
      order_note:'ملاحظات على الطلب', order_note_ph:'مثال: الاتصال قبل التوصيل', coupon:'كود الخصم', coupon_ph:'أدخل الكود', coupon_apply:'تطبيق', coupon_remove:'إزالة',
      coupon_ok:'تم تطبيق الكود', coupon_bad:'الكود غير صالح', ship_calc:'احسب الشحن', ship_pick:'اختر المحافظة لحساب الشحن', checkout:'إتمام الطلب', max_qty:'الحد الأقصى المتاح {n}',
      stock_changed:'تغيّر المخزون، تم تعديل الكمية', added:'تمت الإضافة إلى السلة', items_n:'{n} منتج', pay_cod:'الدفع عند الاستلام',
      cat_laptops:'لابتوبات', cat_phones:'هواتف', cat_cctv:'كاميرات مراقبة', cat_network:'شبكات', cat_acc:'إكسسوارات'
    },
    en: {
      home:'Home', store:'Store', all:'All products', results:'{n} products', no_results:'No matching products. Try fewer filters.',
      clear_all:'Clear all', filters:'Filters', apply:'Show results', category:'Category', brand:'Brand', price:'Price', price_min:'From', price_max:'To',
      in_stock_only:'In stock only', sort:'Sort', view_grid:'Grid view', view_list:'List view', page:'Page', prev:'Previous', next:'Next',
      sort_relevance:'Best match', sort_newest:'Newest', sort_price_asc:'Price: low to high', sort_price_desc:'Price: high to low', sort_name_asc:'Name: A to Z',
      sort_name_desc:'Name: Z to A', sort_rating:'Top rated', sort_discount:'Biggest discount', sort_stock:'In stock first', sort_reviews:'Most reviewed',
      add_to_cart:'Add to cart', choose_options:'Choose options', out_of_stock:'Out of stock', in_stock:'In stock', currency:'EGP', off:'{p}% off',
      search_ph:'Search products…', loading:'Loading…', error:'Could not load. Please try again.', retry:'Retry', demo:'Demo data for preview only', demo_short:'Demo',
      reviews_n:'{n} reviews', no_reviews:'No reviews yet. Only customers who bought this product can review it.', reviews:'Reviews', verified:'Verified buyer',
      select_x:'Select {x}', variant_oos:'Unavailable', only_left:'Only {n} left', stock_ok:'In stock', stock_n:'Available: {n}', sku:'SKU',
      qty:'Quantity', buy_now:'Buy now', delivery:'Delivery', choose_gov:'Choose governorate', deliver_to:'Delivery to {g}', within_days:'Within {a} to {b} business days',
      arrives_between:'Arrives {a} to {b}', ship_cost:'Shipping: {p}', free_ship:'Free shipping', cod_yes:'Cash on delivery available', cod_no:'Cash on delivery not available for this governorate',
      ship_unavailable:'Delivery is not available to this governorate right now', fbt:'Frequently bought together', fbt_total:'Total', add_all:'Add all to cart', this_item:'This item',
      tab_desc:'Description', tab_specs:'Specifications', tab_ship:'Shipping', tab_returns:'Returns', tab_warranty:'Warranty', tab_reviews:'Reviews',
      not_set:'This information has not been set yet. Contact us for details.', zoom_hint:'Hover to zoom, click for full zoom', close:'Close', img_n:'Image {n}',
      cart:'Cart', cart_empty:'Your cart is empty', continue_shop:'Continue shopping', remove:'Remove', subtotal:'Subtotal', shipping:'Shipping', discount:'Discount', total:'Total',
      order_note:'Order note', order_note_ph:'e.g. Call before delivery', coupon:'Coupon code', coupon_ph:'Enter code', coupon_apply:'Apply', coupon_remove:'Remove',
      coupon_ok:'Code applied', coupon_bad:'Invalid code', ship_calc:'Shipping calculator', ship_pick:'Pick a governorate to calculate shipping', checkout:'Checkout', max_qty:'Maximum available: {n}',
      stock_changed:'Stock changed, quantity adjusted', added:'Added to cart', items_n:'{n} items', pay_cod:'Cash on delivery',
      cat_laptops:'Laptops', cat_phones:'Phones', cat_cctv:'CCTV cameras', cat_network:'Networking', cat_acc:'Accessories'
    }
  };
  const GOV = [['Cairo','القاهرة'],['Giza','الجيزة'],['Alexandria','الإسكندرية'],['Qalyubia','القليوبية'],['Port Said','بورسعيد'],['Suez','السويس'],['Damietta','دمياط'],['Dakahlia','الدقهلية'],['Sharqia','الشرقية'],['Gharbia','الغربية'],['Monufia','المنوفية'],['Kafr El Sheikh','كفر الشيخ'],['Beheira','البحيرة'],['Ismailia','الإسماعيلية'],['Fayoum','الفيوم'],['Beni Suef','بني سويف'],['Minya','المنيا'],['Assiut','أسيوط'],['Sohag','سوهاج'],['Qena','قنا'],['Luxor','الأقصر'],['Aswan','أسوان'],['Red Sea','البحر الأحمر'],['New Valley','الوادي الجديد'],['Matrouh','مطروح'],['North Sinai','شمال سيناء'],['South Sinai','جنوب سيناء']].map(g => ({ v: g[0], en: g[0], ar: g[1] }));
  w.UnoI18n = {
    lang: 'ar', S, GOV,
    setLang(l) { this.lang = l === 'en' ? 'en' : 'ar'; document.documentElement.lang = this.lang; document.documentElement.dir = this.lang === 'ar' ? 'rtl' : 'ltr'; },
    t(k, p) { let s = (S[this.lang][k] ?? S.ar[k] ?? k); if (p) for (const x in p) s = s.replace('{' + x + '}', p[x]); return s; },
    pick(o) { return o == null ? '' : (typeof o === 'string' ? o : (o[this.lang] || o.ar || o.en || '')); },
    num(n) { return new Intl.NumberFormat(this.lang === 'ar' ? 'ar-EG' : 'en-US').format(n); },
    money(n) { return this.num(n) + ' ' + this.t('currency'); },
    date(d) { return new Intl.DateTimeFormat(this.lang === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'long' }).format(d); }
  };
})(window);
/* tiny DOM helper shared by the store components */
window.UnoUI = {
  h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    for (const k in (attrs || {})) { const v = attrs[k]; if (v == null || v === false) continue;
      if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (k === 'html') e.innerHTML = v; else e.setAttribute(k, v === true ? '' : v); }
    kids.flat(9).forEach(c => { if (c == null || c === false) return; e.append(c.nodeType ? c : document.createTextNode(c)); });
    return e;
  },
  toast(msg) { const t = UnoUI.h('div', { class: 'us-toast', role: 'status' }, msg); document.body.append(t); setTimeout(() => t.remove(), 2600); }
};
