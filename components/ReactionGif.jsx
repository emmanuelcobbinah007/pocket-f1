import styles from "./ReactionGif.module.css";

/**
 * @param {{ src: string | null, alt?: string }} props
 */
export default function ReactionGif({ src, alt = "Race reaction" }) {
  if (!src) return null;
  return (
    <div className={styles.wrap}>
      <img src={src} alt={alt} className={styles.gif} />
    </div>
  );
}
