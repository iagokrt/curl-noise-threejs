export const addObjectClickListener = (
    camera,
    scene,
    raycaster,
    objectToWatch,
    onMouseClick,
  ) => {
    const objectToWatchId = objectToWatch.uuid;
    let mouse = new THREE.Vector2();

    document.addEventListener(
      "click",
      (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(scene.children);

        const isIntersected = intersects.find(
          (intersectedEl) => intersectedEl.object.uuid === objectToWatchId
        );

        if (isIntersected) {
          onMouseClick();
        }
      },
      false
    );
  };