import React from "react";

export default () => {
  return (
    <>
      <input className="modal-state" id="modal-2" type="checkbox" />
      <div className="modal">
        <label className="modal__bg" htmlFor="modal-2"></label>
        <div className="modal__inner">
          <label className="modal__close" htmlFor="modal-2"></label>
        </div>
      </div>
    </>
  );
};
