

export interface ImageDisplayProp {
    imageUrl: string
}

export default function ProductImageDisplay ({imageUrl}: ImageDisplayProp) {

    return (
        <>
            <div style={{ display: 'flex', inset: 0, position: 'fixed', zIndex: 111, background:'#03429051', flexDirection: 'column', alignItems: 'center'}}>
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '700px', objectFit: 'cover'}}>
                <img src={imageUrl} alt="no image" style={{objectFit:'cover', width: '100%'}}/>
                </div>
            </div>
        </>
    )
}