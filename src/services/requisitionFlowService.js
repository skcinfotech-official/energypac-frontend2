import axiosSecure from "../api/axiosSecure";

export const getRequisitionFlow = async (requisitionId) => {
  const res = await axiosSecure.get(
    `/api/requisitions/${requisitionId}/flow`
  );

  return res.data;
};
