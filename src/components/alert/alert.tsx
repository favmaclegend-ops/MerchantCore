
interface iAlert {
    message?: string,
    type?: string
}

const typeIc = {
    error: 'https://img.icons8.com/?size=100&id=undefined&format=png&color=ff0000',
    success: 'https://img.icons8.com/?size=100&id=11658&format=png&color=008000',
    info: 'https://img.icons8.com/?size=100&id=77&format=png&color=000000'
}
export default function Alert({message = 'Success', type = 'success'}: iAlert) {

    
    return (
        <>
            <dialog style={styles.dialog}>
                <div style={styles.div}>
                    <img src={typeIc[type as keyof typeof typeIc]} width={'30'} height={'30'}/>
                    <p style={{fontSize: '.9rem', lineHeight: '.9rem'}}>{message}</p>
                </div>
            </dialog>
        </>
    )
}

const styles: {[key: string]: React.CSSProperties} = {
    dialog: {
        maxWidth: '500px',
        
        borderRadius: '2rem',
        background: '#fff',
        boxShadow: '0 .2rem 1rem .5rem #f2f2f2',
        display: 'flex',
        border: 'none',
        alignSelf: 'center',
        marginInline: 'auto',
        marginTop: '1rem',
        position: 'fixed',
        top: '0',
        zIndex: '1000'
        
    },
    div :{
        display: 'flex',
        gap: '1rem',
        padding: '1rem 1rem',
        alignItems: 'center'
    }
}