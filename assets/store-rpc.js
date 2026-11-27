/* Uno store RPC bridge: connects the storefront UI (UnoStoreAPI) to the Supabase store_* functions.
   Translates between the UI's data shape and the database shape. Own code. */
(function(w){
var c=w.UNO_CFG;if(!c||!c.url)return;
function call(fn,args){return fetch(c.url+"/rest/v1/rpc/"+fn,{method:"POST",headers:{"Content-Type":"application/json",apikey:c.key,Authorization:"Bearer "+c.key},body:JSON.stringify(args)}).then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error((j&&(j.message||j.msg))||("HTTP "+r.status));return j})})}
function bi(o){o=o||{};return{ar:o.ar||o.en||"",en:o.en||o.ar||""}}
function card(i){var cat=i.category||{};return{id:i.id,slug:i.slug,name:bi(i.name),brand:{v:(i.brand&&i.brand.en)||"",ar:(i.brand&&i.brand.ar)||"",en:(i.brand&&i.brand.en)||""},category:cat.slug||"",category_ar:cat.ar||"",category_en:cat.en||"",price:+i.price,compare_at:i.old_price!=null?+i.old_price:null,stock:i.stock,rating_avg:i.rating!=null?+i.rating:0,reviews_count:i.reviews||0,image:i.image,images:i.images||[],has_variants:!!i.has_variants,demo:!!i.demo}}
function optv(x){if(x&&typeof x==="object")return{v:x.en||x.ar||"",ar:x.ar||x.en||"",en:x.en||x.ar||""};return{v:String(x),ar:String(x),en:String(x)}}
var H={
 store_search:function(a){
  var q={q:a.q||"",limit:a.per_page||a.limit||24,page:a.page||1,sort:a.sort||"relevance"};
  if(a.category)q.categories=[].concat(a.category);if(a.brands&&a.brands.length)q.brands=a.brands;if(a.min!=null)q.price_min=a.min;if(a.max!=null)q.price_max=a.max;if(a.in_stock)q.in_stock=true;if(a.attrs&&Object.keys(a.attrs).length)q.attrs=a.attrs;
  return call("store_search",{a:q}).then(function(r){var f=r.facets||{};
   return{items:(r.items||[]).map(card),total:r.total,page:r.page,pages:Math.max(1,Math.ceil(r.total/(r.per_page||24))),
    facets:{categories:(f.categories||[]).map(function(x){return{v:x.slug,ar:x.name.ar,en:x.name.en,count:x.count}}),brands:(f.brands||[]).map(function(x){return{v:x.name,ar:x.name,en:x.name,count:x.count}}),
     attrs:(f.attrs||[]).map(function(x){return{key:x.key,ar:x.name.ar,en:x.name.en,values:(x.values||[]).map(function(v){return{v:v.en,ar:v.ar,en:v.en,count:v.count}})}}),price:f.price||{min:0,max:0}}}})},
 store_variants_get:function(a){
  return call("store_variants_get",{a:a}).then(function(r){
   if(a.variant_ids||a.ids)return r;
   if(r.error||!r.product)throw new Error(r.error||"not_found");
   var p=r.product,cd=card(p),keys={},opts=[];
   (r.variants||[]).forEach(function(v){Object.keys(v.options||{}).forEach(function(k){if(!keys[k]){keys[k]={key:k,ar:k,en:k,values:[],seen:{}};opts.push(keys[k])}var ov=optv(v.options[k]);if(!keys[k].seen[ov.v]){keys[k].seen[ov.v]=1;keys[k].values.push(ov)}})});
   opts.forEach(function(o){delete o.seen;(p.specs||[]).forEach(function(s){if(s.k===o.key){o.ar=s.l.ar;o.en=s.l.en}})});
   cd.images=p.images&&p.images.length?p.images:[p.image];cd.low_stock_threshold=5;cd.short=null;cd.description=bi(p.desc);
   cd.specs=(p.specs||[]).map(function(s){return{k:bi(s.l),v:bi(s.v)}});
   var pol={};Object.keys(r.policies||{}).forEach(function(k){var x=r.policies[k];pol[k]=x.placeholder?null:bi(x.body)});cd.policies=pol;
   cd.reviews=(r.reviews||[]).map(function(x){return{rating:x.rating,text:x.body||"",verified:true}});
   return{product:cd,options:opts,variants:(r.variants||[]).map(function(v){var o={};Object.keys(v.options||{}).forEach(function(k){o[k]=optv(v.options[k]).v});return{id:v.id,options:o,price:+v.price,stock:v.stock,sku:v.sku,label:v.label,image:v.image}}),bought_together:(r.bought_together||[]).map(card)}})},
 store_shipping_rates:function(a){return call("store_shipping_rates",{a:{governorate:a.governorate}})},
 store_coupon_check:function(a){return call("store_coupon_check",{a:a})},
 store_order_create:function(a){return call("store_order_create",{p:a})},
 store_order_track:function(a){return call("store_order_track",{a:a})},
 store_return_request:function(a){return call("store_return_request",{a:a})},
 store_meta:function(){return call("store_meta",{})},
 ads_get:function(a){return call("ads_get",{p_slot:a.slot,p_lang:a.lang||"ar"})}
};
w.UNO_STORE_RPC=function(name,args){var f=H[name];if(!f)return Promise.reject(new Error("unknown rpc "+name));return f(args||{})};
w.UnoStoreBridge={call:call,handlers:H};
})(window);
