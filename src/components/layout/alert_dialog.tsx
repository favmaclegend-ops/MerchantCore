import { AlertCircle, CheckCircle, Info } from "lucide-react"
import { useEffect } from "react"

interface AlertProps {
    alert: {
        message: string,
        type: string
    },
    display: string,
    setdisplay: CallableFunction
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
            background: 'var(--bg-surface)',
            alignItems: 'center',
            gap: '16px',
            zIndex: 9999,
        }}>
            {(alert.type == "success" && <CheckCircle color="green" />) ||
            (alert.type == "invalid" && <AlertCircle color="red" />) ||
            (alert.type == "info" && <Info color="yellow" />)}
            <p style={{ color: 'var(--text-primary)', margin: 0, fontSize: '14px' }}>{alert.message}</p>
        </div>
    )
};
