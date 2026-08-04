import { ClipboardX } from "lucide-react";
import { cutSelection } from "../spreadSheetLogic";



export function CutButton () {

    return (
        <>
            <button onClick={() => cutSelection(true)} style={{background: 'none', border: 'none', borderRadius: '.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer'}}>
                <ClipboardX size={'30'}/>
                <span>Cut</span>
            </button>
        </>
    )
}