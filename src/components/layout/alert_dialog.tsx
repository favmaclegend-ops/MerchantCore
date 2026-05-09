import { useEffect } from "react"

interface AlertProps {
    alert: {
        message: string,
        type: string
    },
    display: string,
    setdisplay: CallableFunction
}

interface alertIc {
    success: string,
    invalid: string,
    error: string,
    warning: string
}

const alertType: alertIc = {
    success: 'https://img.icons8.com/?size=100&id=11695&format=png&color=05c505',
    invalid: 'https://img.icons8.com/?size=100&id=3062&format=png&color=ff0000',
    error: 'https://img.icons8.com/?size=100&id=360&format=png&color=ff0000',
    warning: 'https://img.icons8.com/?size=100&id=24549&format=png&color=c8c801',
}

export default function AlertDialog({ alert, display, setdisplay }: AlertProps) {

    useEffect(() => {
        const id = setTimeout(() => {
            setdisplay('none');
        }, 1000);

        return () => clearTimeout(id);
    }, [display]);

    return (
        <div style={{
            display: display,
            width: 'auto',
            maxWidth: '300px',
            height: 'auto',
            padding: '16px',
            borderRadius: '32px',
            position: 'fixed',
            top: '16px',
            background: '#e4e4e4',
            alignItems: 'center',
            gap: '16px',
            zIndex: 9999,
        }}>
            <img src={alertType[alert.type as keyof alertIc]} style={{ width: '30px', height: '30px' }} />
            <p style={{ color: '#575757', margin: 0, fontSize: '14px' }}>{alert.message}</p>
        </div>
    )
};
