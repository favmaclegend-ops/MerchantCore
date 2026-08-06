import { MessageCircle, Star } from "lucide-react";
import { useLocation, useParams } from "react-router-dom"
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { marketStore } from "./demoMarketStore";
import { valueFormater } from "./market";
import { ShopPageReabon } from "./components/ShopPageReabon";
import { OverView } from "./components/OverView";


export function ShopPage () {
    const params = useParams();
    const location = useLocation();
    const bp = useBreakpoint();
    
    const shop = marketStore.getSnapshot().shops[params.id ?? ""] 
    if (!shop) {
        return (
            <div>
                Shop not Found
            </div>
        )
    }


    return (
        <>
            <div style={{display: 'flex', width: '100%', height: '100%', padding: bp.sm ? '.25rem' : '.5rem', flexDirection: 'column', maxWidth: '900px', gap: '1rem', overflowY: 'auto', overflowX: 'hidden'}}>
                <div style={{display: 'flex', flexDirection: 'column', width: '100%', position: 'relative'}}>
            
                    <div style={{width: '100%', maxWidth: '1500px', borderRadius: '1rem 1rem 0rem 0rem', height: bp.sm ? '8rem' : '12rem', background: '#050505', position: 'absolute', overflow: 'hidden'}}>
                        <img src={shop.shopProfileImage} style={{objectFit: 'cover', objectPosition: 'center', width: '100%', height: '100%'}}/>
                        <div style={{position: 'absolute', inset: '0', background: 'linear-gradient(to bottom, rgba(2,6,23,.06) 0%, rgba(2,6,23,.18) 30%, var(--bg-surface) 78%)'}}/>
                    </div>

            
                    <div style={{display: 'flex', alignItems: 'center', gap: bp.sm ? '.75rem' : '1rem', zIndex: '11', minHeight: bp.sm ? '9rem' : '13rem', marginTop: bp.sm ? '2rem' : '3rem', padding: bp.sm ? '0 .25rem' : '0 1.25rem', paddingBlockEnd: bp.sm ? '.5rem' : '1rem', minWidth: '0', width: '100%'}}>

                        <div style={{ width: bp.sm ? '4.5rem' : '100%', maxWidth: '8rem', minWidth: bp.sm ? '3.25rem' : '4rem', aspectRatio: '1/1', borderRadius: '50%', background: 'blue', flex: '0 1 auto', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.33)'}}>
                            <img src={shop.shopProfileImage} style={{objectFit: 'cover', objectPosition: 'center', width: '100%', height: '100%'}}/>
                        </div>
                    
                        <div style={{display: 'flex', flexDirection: 'column', minWidth: '0', overflow: 'hidden'}}>
                            <h1 style={{display: 'block', fontWeight: 'bolder', fontSize: bp.sm ? '1.1rem' : '1.5rem', lineHeight: 1.2, textWrap: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%'}}>
                                {shop.shop_name}
                            </h1>
                            <div style={{display: 'flex', alignItems: 'center', gap: '.3rem', marginTop: '.25rem'}}>
                                <Star color="gold" size={bp.sm ? 14 : 16}/>
                                <strong style={{margin: 0, fontSize: bp.sm ? '.85rem' : '.95rem', color: 'var(--text-muted)', textWrap: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden'}}>{valueFormater(shop.rating ?? "0")}</strong>
                            </div>
                        </div>

                    
                        <div style={{display: 'flex', alignItems: 'center', marginInlineStart: 'auto', flexShrink: '0'}}>
                            <button className="click" style={{display: 'flex', padding: bp.sm ? '.6rem .8rem' : '1rem', alignItems: 'center', cursor: 'pointer', gap: '.5rem', borderRadius: '1rem', background: 'var(--bg-nav-active)', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.2)'}}>
                                <MessageCircle size={bp.sm ? 18 : 24} color="var(--bg-surface)"/>
                                {!bp.sm && <span style={{color: 'var(--bg-surface)'}}>Message</span>}
                            </button>
                        </div>
                    
                    </div>
                </div>
                <ShopPageReabon />

                {location.hash === "#products" ? <div>Products</div> : <OverView />}
            </div>

    </>
    )
}