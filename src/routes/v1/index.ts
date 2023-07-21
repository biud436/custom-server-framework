import { ReplyBuilder } from "../../lib/ReplyBuilder";
import { useJson } from "../../lib/useJson";

const v1: FastifyFPHandler = async (_request, _reply) => {
    const builder = new ReplyBuilder(_reply);

    return builder.json().statusOK().response({
        name: "v1",
    });
};

export default v1;
