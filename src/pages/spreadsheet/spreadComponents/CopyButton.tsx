import { Copy } from "lucide-react";
import { copySelection } from "../spreadSheetLogic";



export function CopyButton () {

    return (
        <>
            <button title={`Copy\nctrl+c\nctrl+shift+c with format`} onClick={() => copySelection(true)} style={{background: 'none', border: 'none', borderRadius: '.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer'}}>
                <Copy size={'30'}/>
                <span>Copy</span>
            </button>
        </>
    )
}