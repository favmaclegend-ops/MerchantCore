import { spreadSheetStore } from "@/context/store";
import { ClipboardPaste } from "lucide-react";
import { pasteSelection } from "../spreadSheetLogic";



export function PasteButton () {
    const isPasteButton = spreadSheetStore.getState().isPasteButtonDissable;
    return (
        <>
            <button onClick={() => pasteSelection()} style={{background: 'none', border: 'none', borderRadius: '.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer'}} disabled={isPasteButton}>
                <ClipboardPaste size={'30'} color={isPasteButton ? "#5a5a5a95":'black'}/>
                <span style={{color:isPasteButton ? "#5a5a5a85":''}}>Paste</span>
            </button>
        </>
    )
}