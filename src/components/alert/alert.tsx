import { AlertCircle, CheckCircle, Info } from "lucide-react";

interface iAlert {
  message?: string;
  type?: string;
}

// const typeIc = {
//   error:
//     "https://img.icons8.com/?size=100&id=undefined&format=png&color=ff0000",
//   success: "https://img.icons8.com/?size=100&id=11658&format=png&color=008000",
//   info: "https://img.icons8.com/?size=100&id=77&format=png&color=000000",
// };

export default function Alert({
  message = "Success",
  type = "success",
}: iAlert) {
  return (
    <>
      <dialog style={styles.dialog}>
        <div style={styles.div}>
          {(type == "success" && <CheckCircle color="green" />) ||
            (type == "error" && <AlertCircle color="red" />) ||
            (type == "info" && <Info color="yellow" />)}

          <p
            style={{
              fontSize: ".9rem",
              lineHeight: ".9rem",
              color: "var(--text-primary)",
            }}
          >
            {message}
          </p>
        </div>
      </dialog>
    </>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  dialog: {
    maxWidth: "500px",

    borderRadius: "2rem",
    background: "var(--bg-surface)",
    boxShadow: "var(--shadow-card)",
    display: "flex",
    border: "none",
    alignSelf: "center",
    marginInline: "auto",
    marginTop: "1rem",
    position: "fixed",
    top: "0",
    zIndex: "1000",
  },
  div: {
    display: "flex",
    gap: "1rem",
    padding: "1rem 1rem",
    alignItems: "center",
  },
};
