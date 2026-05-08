interface AlertProps {
    alert : {
        message: string,
        type: string
    }
}


export default function AlertDialog({alert}: AlertProps) {

    return (
        <>
        <div className="alert_cnt-2">
            <img src={alert.type}/>
            <p>{alert.message}</p>
        </div>
        </>
    )
};

