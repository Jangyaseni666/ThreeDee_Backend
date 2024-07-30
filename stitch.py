import cv2
import sys
import os

def stitch_images(image_paths, output_path):
    images = []
    for image_path in image_paths:
        print(f"Reading image {image_path}")  # Debugging line
        img = cv2.imread(image_path)
        if img is None:
            print(f"Error reading image {image_path}")
            return False
        print(img.shape)
        images.append(img)

    if len(images) == 0:
        print("No images to stitch")
        return False

    print("[INFO] stacking images...")
    stitched = cv2.hconcat(images)

    # save the output image
    cv2.imwrite(output_path, stitched)
    return True
#     stitcher = cv2.Stitcher.create(cv2.STITCHER_SCANS)
#     stitcher.setPanoConfidenceThresh(0.5)
#     status, pano = stitcher.stitch(images)

#     if status != cv2.Stitcher_OK:
#         print(f"Error stitching images. Status code: {status}")
#         return False

#     cv2.imwrite(output_path, pano)
#     print(f"Panorama created at {output_path}")
#     return True

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python stitch.py <output_path> <image_path1> <image_path2> ...")
        sys.exit(1)

    output_path = sys.argv[1]
    image_paths = sys.argv[2:]

    if stitch_images(image_paths, output_path):
        print(f"Panorama created at {output_path}")
    else:
        print("Failed to create panorama")
