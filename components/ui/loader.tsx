import styles from "./loader.module.css";

/** ACE loading indicator: a hairline rail with a scanning blue segment. */
export const Loader = ({ label = "Loading" }: { label?: string }) => {
  return (
    <div className={styles.loader} role="status" aria-live="polite">
      <div className={styles.label}>
        <span className={styles.mark}>ACE</span>
        <span>{label}</span>
      </div>
      <div className={styles.rail} />
    </div>
  );
};
