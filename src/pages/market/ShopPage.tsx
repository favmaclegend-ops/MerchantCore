import { MessageCircle, Star } from "lucide-react";
import { useLocation, useParams } from "react-router-dom"
import { marketStore } from "./demoMarketStore";
import { valueFormater } from "./market";
import { ShopPageReabon } from "./components/ShopPageReabon";


export function ShopPage () {
    const params = useParams();
    const location = useLocation();
    
    const shop = marketStore.getSnapshot().shops[params.id] 
    if (!shop) {
        return (
            <div>
                Shop not Found
            </div>
        )
    }


    return (
        <>
            <div style={{display: 'flex', width: '100%', height: '100%', padding: '.5rem', flexDirection: 'column', maxWidth: '900px', gap: '1rem'}}>
                <div style={{display: 'flex', flexDirection: 'column', width: '100%', position: 'relative'}}>

            
                    <div style={{width: '100%', maxWidth: '1500px', borderRadius: '1rem 1rem 0rem 0rem', height: '10rem', background: '#050505', position: 'absolute', overflow: 'hidden'}}>
                        <img src={shop.shopProfileImage} style={{objectFit: 'cover', objectPosition: 'center', width: '100%', height: '100%'}}/>
                    </div>

            
                    <div style={{display: 'flex', alignItems: 'flex-end', zIndex: '11', minHeight: '15rem', gap: '1rem', minWidth: '0', width: '100%'}}>

                        <div style={{ width: '100%', maxWidth: '10rem', minWidth: '4rem', aspectRatio: '1/1', borderRadius: '50%', background: 'blue', flex: '0 1 auto', overflow: 'hidden'}}>
                            <img src={shop.shopProfileImage} style={{objectFit: 'cover', objectPosition: 'center', width: '100%', height: '100%'}}/>
                        </div>
                    
                        <div style={{display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', height: '5rem', minWidth: '0'}}>

                            
                            <div style={{display: 'flex', flexDirection: 'column', width: '100%', overflow: 'hidden', minWidth: '0'}}>
                                <h1 style={{display: 'block', fontWeight: 'bolder', fontSize: '1.5rem', textWrap: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%'}}>
                                    {shop.shop_name}
                                </h1>
                                <div style={{display: 'flex', alignItems: 'center', gap: '.3rem'}}>
                                    <Star color="gold"/>
                                    <strong style={{margin: 0, textWrap: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden'}}>{valueFormater(shop.rating)}</strong>
                                </div>
                                
                            </div>

                         
                            <div style={{display: 'flex', alignItems: 'center', marginInlineStart: 'auto', flexShrink: '0'}}>
                                <button className="click" style={{display: 'flex', padding: '1rem', alignItems: 'center', cursor: 'pointer', gap: '.5rem', borderRadius: '1rem', background: 'var(--bg-nav-active)', border: 'none'}}>
                                    <MessageCircle color="var(--bg-surface)"/>
                                    <span style={{color: 'var(--bg-surface)'}}>Message</span>
                                </button>
                            </div>
                        </div>
                    
                    </div>
                </div>
                <ShopPageReabon />

                {location.hash === "#products" ? <div>Products</div> : <div>OverView</div>}
            </div>

    </>
    )
}