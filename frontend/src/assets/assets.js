import logo from './logo.svg'
import logo_icon from './logo_icon.svg'
import facebook_icon from './facebook_icon.svg'
import instagram_icon from './instagram_icon.svg'
import twitter_icon from './twitter_icon.svg'
import star_icon from './star_icon.svg'
import rating_star from './rating_star.svg'
import sample_img_1 from './sample_img_1.png'
import sample_img_2 from './sample_img_2.png'
import profile_img_1 from './profile_img_1.png'
import profile_img_2 from './profile_img_2.png'
import step_icon_1 from './step_icon_1.svg'
import step_icon_2 from './step_icon_2.svg'
import step_icon_3 from './step_icon_3.svg'
import email_icon from './email_icon.svg'
import lock_icon from './lock_icon.svg'
import cross_icon from './cross_icon.svg'
import star_group from './star_group.png'
import credit_star from './credit_star.svg'
import profile_icon from './profile_icon.png'

export const assets = {
    logo,
    logo_icon,
    facebook_icon,
    instagram_icon,
    twitter_icon,
    star_icon,
    rating_star,
    sample_img_1,
    sample_img_2,
    email_icon,
    lock_icon,
    cross_icon,
    star_group,
    credit_star,
    profile_icon
}

export const postsData = [
  {
    _id: 1,
    text: "Hello world!",
    image_url: `https://www.codelikethewind.org/content/images/size/w2000/2022/05/hello_world.png`,
    status: "approved",
    author: { name: "Shiv" }
  },
  {
    _id: 2,
    text: "Second post",
    image_url: "https://preview.redd.it/what-are-your-thoughts-on-itachi-uchiha-v0-d1v84pkpcsdb1.jpg?auto=webp&s=d666c9922aa2215836db1860e522038b0e161dde",
    status: "approved",
    author: { name: "Rahul" }
  },
  {
    _id: 3,
    text: "Rejected content",
    image_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRd5JKf87_Z-ZuRrvQOhciioFANMN4vV7Qghw&s',
    status: "rejected",
    author: { name: "Amit" }
  }
];