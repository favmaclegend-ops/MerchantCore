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
        <>
            <div className="alert_cnt-2" style={{
                display: display
            }}>
                <img src={alertType[alert.type as keyof alertIc]} />
                <p>{alert.message}</p>
            </div>
        </>
    )
};

