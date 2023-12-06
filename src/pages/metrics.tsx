import { withSSRAuth } from "../utils/withSSRAuth";

export default function Metrics() {
  return (
    <div>
      <h1>Metrics</h1>
    </div>
  );
}

export const getServerSideProps = withSSRAuth(
  async (ctx) => {
    return {
      props: {},
    };
  },
  { permissions: ["metrics.list"], roles: ["administrator"] }
);
