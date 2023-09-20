import "./Input.scss";

const Input = ({ placeholder, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { placeholder: string }) => {
  return (
    <div className="input-wrapper" data-unique>
      <input placeholder={placeholder} {...props} required></input>
      <label>{placeholder}</label>
    </div>
  );
};

export default Input;
