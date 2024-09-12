import { model, Schema } from "mongoose";

const LocalTermCondition = new Schema(
    {
      data: [
        {
          tripType: {
            type: String,
            required: true,
            enum:["local","airpot","oneway","round"]
          },
          tC: [
            {
              type: String, // Array of terms and conditions for the trip type
            }
          ],
        }
      ]
    },
    {
      timestamps: true
    }
  );
  
  const LocalTerm = model("UCS_LOCAL_TC", LocalTermCondition);
  
  export default LocalTerm;
  