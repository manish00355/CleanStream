import { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";

const CreatePost = () => {
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const {backendUrl} = useContext(AppContext);

  const uploadPost = async (text, image) => {
    try {
      const formData = new FormData();
  
      if (text) formData.append("text", text);
      if (image) formData.append("image", image);
  
      const res = await axios.post(
        `${backendUrl}/api/posts`,
        formData,
        {
          withCredentials: true, // important for auth
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
  
      if (res.data.success) {
        toast.success(res.data.message);
        return res.data.post;
      }
  
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Post failed");
    }
  };

  const handleSubmit = async (e) => {
    if(!text && !image) return 
    e.preventDefault();
    await uploadPost(text, image);
  
    setText("");
    setImage(null);
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <textarea
        className="w-full border p-2 rounded mb-2"
        placeholder="Write something..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <input
        type="file"
        onChange={(e) => setImage(e.target.files[0])}
        className="mb-2"
      />

      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Post
      </button>
    </div>
  );
};

export default CreatePost;