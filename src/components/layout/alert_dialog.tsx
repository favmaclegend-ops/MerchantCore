interface AlertProps {
    alert : {
        message: string,
        type: string
    }
}

interface alertIc {
    success: string,
    invalid: string,
    error: string,
    warning: string
}


export default function AlertDialog({alert}: AlertProps) {

    const alertType: alertIc = {
        success: 'https://img.icons8.com/?size=100&id=11695&format=png&color=000000',
        invalid: 'https://img.icons8.com/?size=100&id=3062&format=png&color=000000',
        error: 'https://img.icons8.com/?size=100&id=360&format=png&color=000000',
        warning: 'https://img.icons8.com/?size=100&id=24549&format=png&color=000000',
    }

    return (
        <>
        <div className="alert_cnt-2">
            <img src={alertType[`${alert.type}`]}/>
            <p>{alert.message}</p>
        </div>
        </>
    )
};

