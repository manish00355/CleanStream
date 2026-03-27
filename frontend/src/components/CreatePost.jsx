import { useState } from "react";

const CreatePost = ({ addPost }) => {
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);

  const handleSubmit = () => {
    if (!text && !image) return;

    const newPost = {
      id: Date.now(),
      text,
      image: image ? URL.createObjectURL(image) : null,
      status: "pending",
    };

    addPost(newPost);
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